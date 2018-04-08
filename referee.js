/**
 * Created by Administrator on 2018/2/24.
 */
const puppeteer = require('puppeteer');
const connPool = require("./ConnPools");
(async () => {
    const browser = await puppeteer.launch({
        /*headless:false*/
        /*executablePath:"/opt/google/chrome/google-chrome",
        args: ['--no-sandbox', '--disable-setuid-sandbox']*/
    });
    const page = await browser.newPage();
    await page.emulate({

        'name': 'big laptop',
        'userAgent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.132 Safari/537.36',
        'viewport': {
            'width': 1366,
            'height': 768,

        }
    });
    function savedata(title,content,type,source,casenum,updtime) {
        const pool = connPool();

        pool.getConnection(function(err,conn){
            var insertSpl = 'insert into referee (title,content,type,source,casenum,updtime,createtime) values(?,?,?,?,?,?,current_timestamp)';
            var param = [title,content,type,source,casenum,updtime];
            conn.query(insertSpl,param,function(err,rs){
                if(err){

                    console.log("数据库错误,错误原因:"+err.message);
                }
                else {
                    console.log("数据库插入成功！")
                }
            })
            conn.release();
        });
    }
    function sleep(time1,time2) {
        let ramdom = Math.random()
        let ms = time1 + (time2-time1) * ramdom
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    await page.goto('http://www.hbfy.org/gfcms/site/court/H00/msws/index.html');
    let caseinfo = []
    let one_page,pagei;
    //get caseinfo

    for(let num = 1;num<30;num++){
        console.log("正在获取第"+num+"页信息")
        one_page = await page.evaluate(() => {
            let cases = []
            let page_dom = document.querySelectorAll('#fy_bm .fy_bm_rg .fy_bm_rga table tbody tr')
            for (let i in page_dom){
                if (page_dom[i].childNodes){
                    let urlHtml = page_dom[i].childNodes[1].innerHTML;
                    let urlStart = urlHtml.indexOf("('");
                    let urlEnd = urlHtml.indexOf("')");
                    let realurl = "http://119.97.184.40:9082" + urlHtml.slice(urlStart+2,urlEnd);
                    let casenum = page_dom[i].childNodes[1].innerText;
                    let title = page_dom[i].childNodes[3].innerText.trim();
                    let updtime = page_dom[i].childNodes[5].innerText.trim();
                    let obj = {
                        casenum:casenum,
                        url:realurl,
                        title:title,
                        updtime:updtime
                    }

                    console.log("获取  "+casenum+"   信息")
                    cases.push(obj)
                }
            }

            //获取点击下一页
            let nextpage= document.querySelectorAll('#fy_bm .fy_bm_rg .fy_bm_rga .tablefy form a')
            let pagei;
            for(let i in nextpage){
                //console.log(nextpage[i].innerText)
                if (nextpage[i].innerText && nextpage[i].innerText.trim() === '下一页'){
                    //page.click(nextpage[i])
                    pagei = i
                }
            }

            return [cases,pagei]
        });
        for(let i in one_page[0]){
            caseinfo.push(one_page[0][i])
        }

        //console.log(one_page[1])
        const nextPageBtn = await page.$$('#fy_bm .fy_bm_rg .fy_bm_rga .tablefy form a');
        await nextPageBtn[one_page[1]].click()
        await sleep(3000,8000);
    }

    //goto caseurl and save info

    for(let i in caseinfo){
        console.log("正在爬取  "+caseinfo[i].url)

        await page.goto(caseinfo[i].url)

        //休息一下
        await sleep(3000,10000);

        const result = await page.evaluate(() => {

            let obj = {
                titles:"",
                contents:"",
                updtime:"",
                casenum:""
            };

            let page_dom = document.querySelectorAll("body div")
            let content = "";
            for(let i in page_dom){
                if (page_dom[i].innerText){
                    content = content + page_dom[i].innerText + "\r\n"
                }
            }
            obj.contents = content

            return obj

        });

        savedata(caseinfo[i].title,result.contents,"民事文书","湖北省武汉市中级人民法院",caseinfo[i].casenum,caseinfo[i].updtime)
    }



    console.log("爬取工作已全部完成！")
    await browser.close();


})();