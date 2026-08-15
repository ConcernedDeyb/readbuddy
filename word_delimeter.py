from transformers import AutoProcessor

TARGET_LANG = "tgl"

# --- Old way (has the bug) ---
old_processor = AutoProcessor.from_pretrained("facebook/mms-1b-all")
old_processor.tokenizer.set_target_lang(TARGET_LANG)
print("[OLD] word_delimiter_token_id:", old_processor.tokenizer.word_delimiter_token_id)
print("[OLD] word_delimiter_token:", repr(old_processor.tokenizer.word_delimiter_token))
print("[OLD] convert_tokens_to_ids('|'):", old_processor.tokenizer.convert_tokens_to_ids("|"))

# --- New way (load already targeted at tgl) ---
new_processor = AutoProcessor.from_pretrained("facebook/mms-1b-all", target_lang=TARGET_LANG)
print("[NEW] word_delimiter_token_id:", new_processor.tokenizer.word_delimiter_token_id)
print("[NEW] word_delimiter_token:", repr(new_processor.tokenizer.word_delimiter_token))
print("[NEW] convert_tokens_to_ids('|'):", new_processor.tokenizer.convert_tokens_to_ids("|"))

print("[CHECK] vocab['tgl']['|']:", new_processor.tokenizer.vocab["tgl"]["|"])