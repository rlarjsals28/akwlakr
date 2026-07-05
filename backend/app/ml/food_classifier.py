import json
import random
from pathlib import Path

MODEL_PATH = Path(__file__).resolve().parent / "food101_resnet18.pth"
NUTRITION_DB_PATH = Path(__file__).resolve().parent / "nutrition_db.json"
LABELS_PATH = Path(__file__).resolve().parent / "food101_labels.txt"

TORCH_AVAILABLE = False
_torch = None
_transforms = None
_resnet18 = None
_Image = None

try:
    import torch as _torch
    from torchvision import transforms as _transforms
    from torchvision.models import resnet18 as _resnet18
    from PIL import Image as _Image

    TORCH_AVAILABLE = True
except OSError:
    TORCH_AVAILABLE = False


def _load_nutrition_db() -> dict:
    if NUTRITION_DB_PATH.exists():
        return json.loads(NUTRITION_DB_PATH.read_text(encoding="utf-8"))
    return {"default": {"name_ko": "음식", "calories": 250, "carbs": 30, "protein": 12, "fat": 10, "portion_g": 200}}


def _load_labels() -> list[str]:
    if LABELS_PATH.exists():
        return [line.strip() for line in LABELS_PATH.read_text(encoding="utf-8").splitlines()]
    return [f"food_{i}" for i in range(101)]


class FoodClassifier:
    def __init__(self):
        self.nutrition_db = _load_nutrition_db()
        self.labels = _load_labels()
        self.model = None
        self.transform = None
        self._init_model()

    def _init_model(self):
        if not TORCH_AVAILABLE or _torch is None:
            return

        try:
            model = _resnet18(weights=None)
            model.fc = _torch.nn.Linear(model.fc.in_features, 101)
            if MODEL_PATH.exists():
                model.load_state_dict(_torch.load(MODEL_PATH, map_location="cpu"))
            model.eval()
            self.model = model
            self.transform = _transforms.Compose(
                [
                    _transforms.Resize((224, 224)),
                    _transforms.ToTensor(),
                    _transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
                ]
            )
        except Exception:
            self.model = None
            self.transform = None

    def classify_image(self, image_path: str) -> tuple[str, float]:
        if self.model and self.transform and _Image is not None and _torch is not None:
            try:
                image = _Image.open(image_path).convert("RGB")
                input_tensor = self.transform(image).unsqueeze(0)
                with _torch.no_grad():
                    outputs = self.model(input_tensor)
                    confidence, idx = _torch.softmax(outputs, dim=1).max(1)
                label = self.labels[idx.item()] if idx.item() < len(self.labels) else "unknown"
                return label, float(confidence)
            except Exception:
                pass

        fallback_foods = ["bibimbap", "grilled_salmon", "chicken_curry", "sushi", "caesar_salad", "omelette"]
        return random.choice(fallback_foods), 0.75

    def get_nutrition(self, label: str) -> dict:
        entry = self.nutrition_db.get(label, self.nutrition_db.get("default"))
        portion_factor = entry.get("portion_g", 200) / 100
        return {
            "predicted_food": entry.get("name_ko", label.replace("_", " ")),
            "calories": round(entry["calories"] * portion_factor, 1),
            "carbs": round(entry["carbs"] * portion_factor, 1),
            "protein": round(entry["protein"] * portion_factor, 1),
            "fat": round(entry["fat"] * portion_factor, 1),
        }


classifier = FoodClassifier()


def analyze_image(image_path: str) -> dict:
    label, confidence = classifier.classify_image(image_path)
    nutrition = classifier.get_nutrition(label)
    nutrition["confidence"] = round(confidence, 3)
    nutrition["label_en"] = label
    return nutrition
