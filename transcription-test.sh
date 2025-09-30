export GEMINI_API_KEY='AIzaSyDoGxioO33UxmUeQywDnd9Omt6IrbtzwqY'
export GEMINI_MODEL='gemini-2.5-flash'
export VIDEO_PATH='/Users/rmanor/Downloads/tt.mp4'
export TMP_UPLOAD='https://generativelanguage.googleapis.com/v1beta/files?key='"$GEMINI_API_KEY"

# 1) Upload the MP4
curl -X POST "$TMP_UPLOAD" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
        "file": {
          "name": "tt.mp4",
          "mimeType": "video/mp4"
        }
      }' > /tmp/file-meta.json

FILE_NAME=$(jq -r '.file.name' /tmp/file-meta.json)
UPLOAD_URL=$(jq -r '.file.uri' /tmp/file-meta.json)

# 2) PUT actual bytes (resumable upload endpoint returned above)
curl -X PUT "$UPLOAD_URL" \
  -H "Content-Type: video/mp4" \
  --data-binary @"$VIDEO_PATH"

# 3) Poll file status until state == ACTIVE
curl "https://generativelanguage.googleapis.com/v1beta/files/$FILE_NAME?key=$GEMINI_API_KEY"

# 4) Invoke generateContent with the file URI
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/$GEMINI_MODEL:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "contents": [
          {
            "role": "user",
            "parts": [
              { "text": "Transcribe every spoken word from this video. Return ONLY the verbatim transcript with no additional commentary." },
              { "fileData": { "fileUri": "'"$UPLOAD_URL"'" } }
            ]
          }
        ]
      }'

# 5) (Optional) delete file afterwards
curl -X DELETE "https://generativelanguage.googleapis.com/v1beta/files/$FILE_NAME?key=$GEMINI_API_KEY"
