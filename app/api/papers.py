from fastapi import APIRouter, HTTPException, Header
import arxiv
from typing import List, Optional
from openai import OpenAI
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging

# 配置日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class PaperSummary(BaseModel):
    title: str
    authors: List[str]
    published: datetime
    summary: Optional[dict] = None
    abstract: str
    url: str
    pdf_url: str

def generate_summary(abstract: str, api_key: str) -> dict:
    """使用 OpenAI API 生成論文摘要"""
    try:
        logger.info("Generating summary using OpenAI API")
        client = OpenAI(api_key=api_key)
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful research assistant. Please analyze the following paper abstract and provide a summary in the following format:\n- Observation: Key problem or issues identified\n- Objective: Research goal or intended solution\n- Challenge: Main technical or conceptual difficulties\n- Main Idea: The proposed approach or technique"},
                {"role": "user", "content": abstract}
            ]
        )
        
        summary_text = response.choices[0].message.content
        summary_parts = summary_text.split('\n')
        
        summary = {
            'observation': summary_parts[0].replace('- Observation: ', '').strip(),
            'objective': summary_parts[1].replace('- Objective: ', '').strip(),
            'challenge': summary_parts[2].replace('- Challenge: ', '').strip(),
            'main_idea': summary_parts[3].replace('- Main Idea: ', '').strip()
        }
        
        return summary
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return {
            'observation': 'Summary generation failed',
            'objective': 'Error occurred while processing',
            'challenge': str(e),
            'main_idea': 'Please try again later'
        }

@router.get("/papers/", response_model=List[PaperSummary])
async def get_papers(
    category: str = "cs.CV",
    max_results: int = 10,
    days: int = 7
):
    """獲取最新的 arXiv 論文列表（不包含摘要）"""
    try:
        logger.info(f"Fetching papers for category: {category}")
        
        # 驗證輸入參數
        if max_results > 50:
            max_results = 50  # 限制最大結果數
        
        if days > 30:
            days = 30  # 限制最大天數
        
        # 構建更精確的搜索查詢
        search_query = f'cat:{category} AND submittedDate:[{(datetime.now() - timedelta(days=days)).strftime("%Y%m%d")}000000 TO {datetime.now().strftime("%Y%m%d")}235959]'
        logger.info(f"Search query: {search_query}")
        
        # 設置搜索條件
        arxiv_client = arxiv.Client()
        search = arxiv.Search(
            query=search_query,
            max_results=max_results,
            sort_by=arxiv.SortCriterion.SubmittedDate,
            sort_order=arxiv.SortOrder.Descending
        )

        papers = []
        try:
            results = list(arxiv_client.results(search))
            logger.info(f"Found {len(results)} papers from arXiv")
            
            for result in results:
                try:
                    paper = PaperSummary(
                        title=result.title,
                        authors=[author.name for author in result.authors],
                        published=result.published,
                        abstract=result.summary,
                        url=result.entry_id,
                        pdf_url=result.pdf_url
                    )
                    papers.append(paper)
                    
                except Exception as e:
                    logger.error(f"Error processing paper {result.title}: {str(e)}")
                    continue

        except Exception as e:
            logger.error(f"Error fetching results from arXiv: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Error fetching results from arXiv: {str(e)}"
            )

        if not papers:
            logger.warning(f"No papers found for category: {category}")
            return []

        logger.info(f"Successfully processed {len(papers)} papers")
        return papers

    except Exception as e:
        logger.error(f"Error in get_papers: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while fetching papers: {str(e)}"
        )

@router.get("/papers/{paper_id}/summary")
async def get_paper_summary(paper_id: str, x_api_key: str = Header(...)):
    """為指定的論文生成摘要"""
    try:
        if not x_api_key:
            raise HTTPException(status_code=401, detail="API Key is required")
            
        # 從 arXiv 獲取論文
        arxiv_client = arxiv.Client()
        search = arxiv.Search(id_list=[paper_id])
        results = list(arxiv_client.results(search))
        
        if not results:
            raise HTTPException(status_code=404, detail="Paper not found")
            
        paper = results[0]
        summary = generate_summary(paper.summary, x_api_key)
        
        return {"summary": summary}
        
    except Exception as e:
        logger.error(f"Error generating summary for paper {paper_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating summary: {str(e)}"
        )

@router.get("/categories")
def get_categories():
    """獲取可用的論文類別"""
    return {
        "categories": [
            {"id": "cs.CV", "name": "Computer Vision and Pattern Recognition"},
            {"id": "cs.AI", "name": "Artificial Intelligence"},
            {"id": "cs.LG", "name": "Machine Learning"},
            {"id": "cs.CL", "name": "Computation and Language"},
            {"id": "cs.RO", "name": "Robotics"}
        ]
    }
