import cloudscraper
import sys 

scraper = cloudscraper.create_scraper()
r = scraper.post('https://haapi.ankama.com/json/Ankama/v2/Api/CreateApiKey', data={'login': sys.argv[1], 'password': sys.argv[2]})
print(r.text)