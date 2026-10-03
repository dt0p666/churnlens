from fastapi import APIRouter, Depends, HTTPException
from api.schemas import CustomerProfileSchema
from api.dependencies import get_explainer
from src.explain import ChurnExplainer

router = APIRouter(tags=["Explainability"])

@router.post("/explain")
def explain_customer(
    profile: CustomerProfileSchema,
    top_n: int = 8,
    explainer: ChurnExplainer = Depends(get_explainer)
):
    try:
        data_dict = profile.model_dump(by_alias=True)
        return explainer.explain_instance(data_dict, top_n=top_n)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
