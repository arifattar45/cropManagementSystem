# scripts/dataset_split.py

import os
import pandas as pd
from sklearn.model_selection import train_test_split

def create_csvs(image_dir="dataset/images", output_dir="dataset"):
    test_dir = os.path.join(image_dir, "test_images")

    print(f"🔍 Looking inside: {image_dir}")
    print("📂 Folders found:", os.listdir(image_dir))

    # 1. Collect training data
    data = []
    for label in os.listdir(image_dir):
        class_dir = os.path.join(image_dir, label)
        if os.path.isdir(class_dir) and label != "test_images":
            print(f"➡️ Processing class: {label}")
            for img in os.listdir(class_dir):
                if img.lower().endswith(('.png', '.jpg', '.jpeg')):
                    data.append([f"{image_dir}/{label}/{img}", label])

    print(f"✅ Total images collected: {len(data)}")

    if not data:
        print("❌ No training images found! Check file extensions.")
        return

    df = pd.DataFrame(data, columns=["image", "label"])

    # 2. Create numeric label mapping
    label_map = {label: idx for idx, label in enumerate(sorted(df["label"].unique()))}
    df["label_id"] = df["label"].map(label_map)

    # 3. Split into train.csv and val.csv
    train_df, val_df = train_test_split(
        df, test_size=0.2, stratify=df["label"], random_state=42
    )

    os.makedirs(output_dir, exist_ok=True)
    train_df.to_csv(os.path.join(output_dir, "train.csv"), index=False)
    val_df.to_csv(os.path.join(output_dir, "val.csv"), index=False)

    print(f"📊 Train size: {len(train_df)}, Val size: {len(val_df)}")

    # 4. Create test.csv (no labels)
    test_files = []
    if os.path.exists(test_dir):
        for img in os.listdir(test_dir):
            if img.lower().endswith(('.png', '.jpg', '.jpeg')):
                test_files.append([f"{image_dir}/test_images/{img}"])

    test_df = pd.DataFrame(test_files, columns=["image"])
    test_df.to_csv(os.path.join(output_dir, "test.csv"), index=False)

    print(f"🧪 Test images: {len(test_df)}")

    # 5. Save label mapping
    mapping_df = pd.DataFrame(list(label_map.items()), columns=["label", "label_id"])
    mapping_df.to_csv(os.path.join(output_dir, "label_mapping.csv"), index=False)

    print("✅ train.csv, val.csv, test.csv, and label_mapping.csv created in:", output_dir)

if __name__ == "__main__":
    create_csvs()
