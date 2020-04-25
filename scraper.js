const puppeteer = require('puppeteer');

const searchRecipe = async (recipeName) => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    await page.goto(`https://www.bbc.co.uk/food/search?q=${encodeURI(recipeName.toLowerCase())}`, {waitUntil: 'networkidle2'});

    await page.waitForSelector('.search-filterbar__container');
    const recipeObj = await page.evaluate(() => {
        let recipeCard = [...document.querySelectorAll('a.promo__main_course')];
        return recipeCard.map((div) =>{
                return{
                    title: div.querySelector('h3.promo__title').innerText,
                    link: 'https://www.bbc.co.uk'+div.getAttribute('href'),
                    serves: div.querySelectorAll('p.promo__recipe-info__serving-size')[0].innerText,
                    prep: div.querySelectorAll('p.promo__recipe-info__prep-time')[0].innerText,
                    cook: div.querySelectorAll('p:last-child')[0].innerText,
                }
            }
        );
    });
    for (let i = 0; i < recipeObj.length; i++) {
        try {
            const newPage  = await browser.newPage();
            await newPage.goto(recipeObj[i].link,{waitUntil: 'networkidle2'});

            await newPage.waitForSelector('h1.content-title__text');

            const [ingredient] = await newPage.$x('//*[@id="main-content"]/div[1]/div[4]/div/div[1]/div/div[1]/div[4]/div/div');
            const [method] = await newPage.$x('//*[@id="main-content"]/div[1]/div[4]/div/div[1]/div/div[1]/div[5]/div/div');
            
            recipeObj[i]['ingrediants'] = await (await ingredient.getProperty('textContent')).jsonValue();
            recipeObj[i]['method'] = await (await method.getProperty('textContent')).jsonValue();

            await delete recipeObj[i]['link'];

            await newPage.close();
        } catch (error) {
            console.log('err',error);
        }
    };
    console.log(recipeObj);
    await browser.close();
};

searchRecipe('biryani');