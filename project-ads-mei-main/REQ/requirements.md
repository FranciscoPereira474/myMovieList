# Requirements for a movie recommendation system

## 1. Main page
1. **Main Page** Show a main page with a top bar for navigation and other contents.
3. **Recommendations** Have some recommended movies in the main page, displaying generalized recs when the system can't make recommendations for the user.
4. **Popular Movies of the Week** Show the most watched movies during last week, being able to navigate to each movie page or to see the full list page.
5. **Popular Reviews of the Week** Show the top rated reviews posted during last week for multiple movies, being able to see each review, who wrote it, its rating, post date, related movie and to navigate to that review's page, movie, and user.
6. **Top Rated Movies All-Time** Show the top rated movies of all time and their rating, being able to navigate to each Movie page or to see the full list page.
7. **Top Rated Reviews All-Time** Show the top rated reviews of all time for multiple movies, being able to see each review, who wrote it, its rating, post date, related movie and to navigate to that review's page.

## 2. Movie Page
1. **Movie Page** Show a page for a specific movie, displaying details like title, description, rating, year of release, director, actors, reviews, etc.
2. **Marking as Watched Functionality** Ability to mark the movie as watched if logged in.
3. **Adding to Watchlist Functionality** Ability to add the movie to the watchlist if logged in (implies user didn't watch it).
4. **Rating Functionality** Ability to rate the movie if logged in (implies the user watched it).
5. **Popular Reviews** Display reviews with the most likes, dislikes and comments. Clicking on a user or review should navigate to the corresponding page. Ability to like or dislike the review. Clicking on comments navigates to the review's page.
6. **Recent Reviews** Display recent reviews. Clicking on a user or review should navigate to the corresponding page. Ability to like or dislike the review. Clicking on comments navigates to the review's page.
7. **Review Functionality** Ability to make a review of the movie if user is logged in and has watched the movie.

## 3. Movie List Page
1. **Movie List Page** Show a page containing a list of movies. Clicking on a movie navigates to its page.
2. **Search Functionality** Ability to filter displayed movies by search input.
3. **Filter Functionality** Ability to filter displayed movies by applying multiple filter categories such as: genre, above certain rating.
4. **Sorting Functionality** Ability to sort displayed movies by a feature such as: year of release, rating, etc. (Allow ascending and descending order.)

## 4. Review Page
1. **Review Page** Show a page for a specific review, displaying details such as review text, who wrote it, post date, related movie, rating, replies, likes, etc.
2. **Rating Functionality** Ability to rate the review if logged in.
3. **Reply Functionality** Ability to reply to the review if logged in.
4. **Review Language Filter** Review content should be analysed by a third party API to find obscene language.

## 5. User Authentication
1. **User Sign Up** Be able to sign up a new user with a non existing email/username and password.
2. **User Log In** Be able to log in as a user with an email/username and password.
3. **User Sign/Log in** Could be able to log/sign in with third party authenticators(Google,GitHub).
4. **Log out** Be able to log out.

## 6. API Integration
1. All path and query parameters resolve successfully.

## 7. Database
1. **Store relevant information** Use a database to store user and movies' metadata and their relationships.
2. **Security** Passwords and other sensitive data must be encrypted on storage.
3. **Integrity** Data must not be changed in transit, furthermore it can't be altered by unauthorized people.
4. **Availability** Data availability is assured by the chosen cloud provider.

## 8. Cloud Integration
1. **Deployment** The entire infrastructure must be deployed to a cloud environment.

## 9. User Page
1. **User Page** Show a page for a specific user, displaying his recently watched, watched and plan-to-watch Movie lists, etc.
2. **User Page** Show a default profile picture that the user can change.

## 10. Navigation Bar
1. **Navigation Bar** Have a navigation bar at the top of every page for navigation across the site.
2. **Logo/Website title** Clicking on it takes user to home page.
3. **Browse Link** Hovering it shows a dropdown menu with various predefined movie pages (filtered/sorted list of movies). Clicking on browse takes user to complete movie list page.
4. **Watched Movies Link** Clicking on it takes user to its list of rated movies. Implies user is authenticated.
5. **Watchlisted Movies Link** Clicking on it takes user to its watchlist. Implies user is authenticated.
6. **Searchbar** User can submit a search query to find movies.
7. **User corner** Section with user's username and its profile picture. Hovering it opens a dropdown menu with user related options such as settings. Clicking on it takes user to user's page. Must include a log out button. Implies the user is logged in.
8. **Signup/Login Pages Link** Clicking on one takes user to its respective page. Implies user is not authenticated.