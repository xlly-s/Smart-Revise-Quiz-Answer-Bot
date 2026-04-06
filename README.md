# Smart-Revise-Quiz-Answer-Bot
Quiz answer bot for the website: smartrevise.online, only for the quiz section of the website, to help gain XP. This is used with Groq AI to check answers in the website and refrence them to the program, and then storing answers in a database. 
If your interested to know how it works, look to the bottom. Any issues create one and I'll try my best to help!



 # INSTRUCTIONS FOR USE

 ## Setup

1. Download the provided '.js' file in this repo and open it into notepad. <br />
2. Search for 'Authorization' (no speechmarks) until you come to the " 'Authorization': 'Bearer key_here' ". <br />
3. Where it says this, put your groq api key where it says 'key_here' and ensure to keep the Bearer piece of the code there. (If you need a key see below.) <br />
It should now look like:  'Authorization': 'Bearer gsk_xxxxxxxxxx'
4. Now goto smartrevise.online and open up your quiz page, where it looks like below. (Apply the filters to your liking.) <br />

<img width="1891" height="637" alt="image" src="https://github.com/user-attachments/assets/c3263174-4a84-48d0-98e9-e69bcd9e81c8" />

5. With whatever browser you are doing (Tested on Firefox, Edge, and Chrome) open up the Devtools window.
6. From there open the console tab.
7. Take the code you just edited with your API key and pasted it into the console (if it is your first time you might need to type 'allow pasting' before being allowed to paste.)
8. Press entire and away you go! IF you refresh the page you will have to rerun.

   <img width="1916" height="830" alt="image" src="https://github.com/user-attachments/assets/ff53ee36-3596-4f42-9e0e-8403ece3b029" />

# HOW TO GET GROQ API KEY

## Make sure it is Groq, not Grok.
1. Head over to https://groq.com/ and create/login to an account
2. Then go to https://console.groq.com/keys and click 'Create API key' in the top right corner.
<img width="318" height="120" alt="image" src="https://github.com/user-attachments/assets/e3f01fc2-f1ba-4bfa-b008-0df1492c62df" />

3. Set your key for whatever you want, name does not matter but set the expiration date to your desired time.
4. Copy your key
<img width="757" height="368" alt="image" src="https://github.com/user-attachments/assets/09f8771c-abcf-4285-952c-2aecdab62cd8" />

5. Paste it into the desired spot in the code, and continue with the steps.





# How does it work?

So this was basically a random project created during ym computer science classes during school, I wanted a quick way to get to the top of our leaderboard and instead of doing it manually (Becasue who likes that) I decided the best course of action was creating a bot to do it for me.
I started by looking at the requests being sent/recieved to see if there was anyway I could resend requests quickly (As the casee with seneca) but I sadly couldnt find any that what consistently work without lots of authorization etc, so I pushed that aside. Then I remember how AI can be used for things like this, so I experimented with sending and receiving to APIs with javascript, as well as scraping data and parsing it onto the AI.
Now I had the issue of reading the text, luckily in google and javascript reading text is really easy, it just involves stuff like [Coded removed due to github formatting lol] to read for text in the whole page and then get rid of any arrows or cross and just output it as straight plain text. With this I could then tell the ai to take 4 of those options (As it is always 4 choices on smartrevise) and assign a number to each of these choices (1,2,3,4 and -1 if they don't know) this meant I know had a universal language between the script and the AI meaning the ai would output just one number and the ai could parse that and match it up. This proved very succesfull but ended being a pain because of the API way groq works it doesnt really remember answers and will change its mind frequently, this could be fixed with naother request telling it was wrong/right but thats way too many requests and I'd end up getting ratelimited. So I decided to create it with databases and then whenever the answer is answered it scans the page to find the answers and then take the answer in text form with this then meant I could store it for a later date along with the question text and amth the 2 up, since these don't get changed it means it works forever. This then meant I could implement a check before the AI kicks in to see if the qeustion had already been answered. Now becuase of my answer checking algorithim it meant that I could also tell if the ai got the question correct or not, if they didn't then I could also see what the correct answer was a store it, I could have left out the AI but with it meant I could get a better chance at of getting it right first time and increasing statistics. All this combined together meant that after only 1 pass of the questions it would know the correct answer and answer about every 5 seconds due to groq and smart revises ratelimits. Only problem is that it is to obvious as you can get a perfect score and mastery in about 1-2 hours of constant running and 9000 in about 30 mins. It goes very fast and you can edit the code to optimise it. It was a challenge in the command line but this felt like the best approach.
Happy for people to improve it as currently the DB isnt saved, so you could probably get it to download/update a database and therefore have it continue cross computer and gain a full database to all questions. 
