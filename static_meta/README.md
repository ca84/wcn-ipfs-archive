# Static Meta Data
The JSON files in here represent meta data that can't be extracted and needs to be defined and maintained manually.

## category data
The assignement of media items to categories is done very simpel and might have to change in the future. For now a category is defined by a short name, a display name and a array of search-strings:

	{"short": "twic", "title": "This Week In Cryptos", "find":["this week in cryptos", "twic"], "ep_count":0}

Media items are asociated with the categories if one of the search-strings has a partial case-insensitiv match in the media items title.

Everyone is welcome to contribut add for example missing shows to the *categories_wcnshows.json* via pull request, but please test your search-strings first with the avalible test data.

For example like that:

	cat static_meta/test_data/list_of_wcnshows_names.txt|grep -i "your search string"



