import torch
from transformers import AutoProcessor, Wav2Vec2ForCTC

# Way 1: exactly what the training script did
model_a = Wav2Vec2ForCTC.from_pretrained(
    "facebook/mms-1b-all", target_lang="tgl", ignore_mismatched_sizes=True
)
print("Way 1 (training script's loading) lm_head shape:", model_a.lm_head.weight.shape)

# Way 2: the blog's literal pattern - plain load, then load_adapter
model_b = Wav2Vec2ForCTC.from_pretrained("facebook/mms-1b-all")
model_b.load_adapter("tgl")
print("Way 2 (plain load + load_adapter) lm_head shape:", model_b.lm_head.weight.shape)

# NEW: compare actual values, not just shape
weights_identical = torch.equal(model_a.lm_head.weight, model_b.lm_head.weight)
print(f"\nlm_head weights identical: {weights_identical}")

if not weights_identical:
    diff = (model_a.lm_head.weight - model_b.lm_head.weight).abs()
    print(f"Max abs difference: {diff.max().item():.6f}")
    print(f"Mean abs difference: {diff.mean().item():.6f}")

# Print basic stats for each - a freshly reinitialized head typically has a
# very different mean/std distribution than a trained/pretrained one
for name, model in [("Way 1", model_a), ("Way 2", model_b)]:
    w = model.lm_head.weight
    print(
        f"{name} lm_head stats -> mean: {w.mean().item():.6f}, "
        f"std: {w.std().item():.6f}, "
        f"first 5 values: {w.flatten()[:5].tolist()}"
    )