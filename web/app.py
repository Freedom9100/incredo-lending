from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Literal
import pandas as pd
import pickle
import json

class LoanApplication(BaseModel):
    age: int
    year_income: int
    work_experience: int
    credit_history_length: int
    home_status: Literal['RENT', 'OWN', 'MORTGAGE', 'OTHER']
    credit_purpose: Literal['PERSONAL', 'EDUCATION', 'MEDICAL', 'VENTURE', 'HOMEIMPROVEMENT', 'DEBTCONSOLIDATION']
    credit_grade: Literal['A', 'B', 'C', 'D', 'E', 'F', 'G']
    cb_person_default: Literal['Y', 'N']
    credit_amount_rub: int

app = FastAPI(title="Credit Scoring API")
app.mount("/static", StaticFiles(directory="web/static"), name="static")
templates = Jinja2Templates(directory="web/templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

model = None
model_columns = None

@app.on_event("startup")
def load_model():
    global model, model_columns

    print("Loading model...")

    try:

        with open('models/random_forest_model.pkl', 'rb') as f:
            model = pickle.load(f)

        with open('models/model_columns.json', 'r') as f:
            model_columns = json.load(f)

        print("Model loaded")

    except FileNotFoundError:
        print("No model found...")

@app.post("/predict")
def predict(application: LoanApplication):
    input_data = pd.DataFrame([application.dict()])

    USDT_RATE = 90.0
    input_data['year_income'] = input_data['year_income'] / USDT_RATE
    credit_amount_usdt = input_data['credit_amount_rub'] / USDT_RATE

    if input_data['year_income'].iloc[0] > 0:
        input_data['credit_percent_income'] = credit_amount_usdt / input_data['year_income']
    else:
        input_data['credit_percent_income'] = 0

    if input_data['age'].iloc[0] > 18:
        input_data['credit_history_ratio'] = input_data['credit_history_length'] / (input_data['age'] - 18)
    else:
        input_data['credit_history_ratio'] = 0

    grade_map = {'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1, 'G': 0}
    input_data['credit_grade'] = input_data['credit_grade'].map(grade_map)
    default_map = {'Y':1, 'N':0}
    input_data['cb_person_default'] = input_data['cb_person_default'].map(default_map)

    cols_to_drop = ['age', 'credit_history_length', 'credit_amount_rub']
    input_data = input_data.drop(cols_to_drop, axis=1)

    for col in model_columns:
        if col not in input_data.columns:
            input_data[col] = 0

    final_input = input_data[model_columns]

    probabilities = model.predict_proba(final_input)
    default_proba = probabilities[0][1]
    approval_proba = 1 - default_proba

    return {
        "probability": float(approval_proba)
    }
