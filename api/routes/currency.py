from fastapi import APIRouter
from src.currency import get_currency_config, convert_from_usd, convert_to_usd

router = APIRouter(prefix="/config", tags=["Configuration"])

@router.get("/currency")
def get_currency_settings():
    """
    Returns reference currency rates, locale specifications, and disclosure text.
    """
    return get_currency_config()
