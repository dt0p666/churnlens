import io
from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, Query, HTTPException
from fastapi.responses import StreamingResponse
import pandas as pd

from api.dependencies import get_predictor
from src.predict import ChurnPredictor

router = APIRouter(prefix="/predict", tags=["Batch Prediction"])

@router.post("/batch")
async def predict_batch_csv(
    file: UploadFile = File(...),
    threshold: Optional[float] = Query(None, ge=0.01, le=0.99),
    download_csv: bool = Query(False),
    predictor: ChurnPredictor = Depends(get_predictor)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a CSV format.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        scored_df, summary = predictor.predict_batch(df, custom_threshold=threshold)

        if download_csv:
            stream = io.StringIO()
            scored_df.to_csv(stream, index=False)
            response = StreamingResponse(
                iter([stream.getvalue()]),
                media_type="text/csv"
            )
            response.headers["Content-Disposition"] = f"attachment; filename=scored_{file.filename}"
            return response

        # Robust NaN-safe dictionary conversion for clean JSON output
        raw_preview = scored_df.head(50).to_dict(orient="records")
        preview_records = [
            {k: (None if pd.isna(v) else v) for k, v in row.items()}
            for row in raw_preview
        ]
        return {
            "summary": summary,
            "preview": preview_records
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch processing error: {str(e)}")
