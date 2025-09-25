import requests
url = 'https://gencstorage.b-cdn.net/thumbnails/test-n.jpg'
response = requests.get(url)
print(response.headers)
