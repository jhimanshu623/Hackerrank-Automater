const puppeteer = require('puppeteer');
let { email, pwd, url } = require("./credentials.json");

(async () => {
    
    let browser = await puppeteer.launch({
        headless:false,
        defaultViewport:null,
        args:["--start-maximized"]
    });

    // returns Promise which resolves to an array of all open pages.
    let pagesArr = await browser.pages();
    let page = pagesArr[0];
    await page.goto(url); 
    
    // ********* LOGIN **************
    
    await page.type("#input-1",email);
    await page.type("#input-2",pwd);
    await navigate('button[data-analytics="LoginPassword"]',page);

    // ************Dashboard**********
    await waitAndClick('a[data-analytics="NavBarProfileDropDown"]',page);
    await waitAndNavigate('a[data-analytics="NavBarProfileDropDownAdministration"]',page);

    // ************Admin Page**********
    await page.waitForSelector('.nav-tabs.nav.admin-tabbed-nav',{visible:true});
    let alltabs=await page.$$('.nav-tabs.nav.admin-tabbed-nav li');
    // await navigate('a[href="/administration/challenges"]',page);
    await alltabs[1].click();
    await page.waitForNavigation({waitUntil: "networkidle0"})
    await handleSinglePage(browser, page);
    // await browser.close(); //not working
})();

// click on selector of a given page and wait for navigation
async function navigate(selector,page)
{
    await Promise.all([
        await page.click(selector),
        await page.waitForNavigation({
            waitUntil: "networkidle0"
        })
    ]);

}

// wait for the given selector to be visible and then click
async function waitAndClick(selector,page)
{
    await Promise.all([
        await page.waitForSelector(selector,{visible:true}),
        await page.click(selector)
    ]);
}

// wait for the given selector to be visible and then click and wait for navigation.
async function waitAndNavigate(selector,page)
{
    await Promise.all([
        await page.waitForSelector(selector,{visible:true}),
        await navigate(selector,page)
    ]);
}

async function handleSinglePage(browser,page)
{
    await page.waitForSelector(".backbone.block-center", { visible: true });
    let allCh=await page.$$('.backbone.block-center');
    let allLinkPr=[];
    for(let i=0;i<allCh.length;i++)
    {
        let linkPr=await page.evaluate(function(elem){
            return elem.getAttribute("href");
        },allCh[i]);

        allLinkPr.push(linkPr);
    }
    let allLinks=await Promise.all(allLinkPr);

    let allPages=[];
    for(let i=0;i<allLinks.length;i++)
    {
        let nPage=await browser.newPage();
        let cUrl="https://www.hackerrank.com" + allLinks[i];
        let nPagePr=challengeHandler(nPage,cUrl);
        allPages.push(nPagePr);
    }

    await Promise.all(allPages);

    // next page
    let allLis=await page.$$('.pagination ul li');
    let nextBtn=allLis[allLis.length-2];
    let isDisabled=nextBtn.evaluate(function(elem)
    {
        return elem.getAttribute("class");
    },nextBtn);
    if(isDisabled=="disabled")
    {
        return;
    }
    else
    {
        await nextBtn.click();
        await await page.waitForNavigation({
            waitUntil: "networkidle0"
        });
        await handleSinglePage(browser,page);
    }
}

// add moderator to given challenge
async function challengeHandler(page,url)
{
    await page.goto(url);
    await handleSaveDialogBox('#confirm-modal',page);
    waitAndNavigate('li[data-tab="moderators"]',page);
    await page.waitForSelector('#moderator',{visible:true});
    await page.type('#moderator','himanshu');
    // await tab.keyboard.press("Enter");
    await page.click('.btn.moderator-save');
    await page.click('.save-challenge.btn.btn-green');
    await page.close();
}     

async function handleSaveDialogBox(selector,page)
{
    try
    {
        await page.waitForSelector(selector,{visible:true,timeout:10000});
        await page.click('#confirmBtn');
    }catch(err)
    {
        console.log("Data was saved NP:)");
        return;
    }
}