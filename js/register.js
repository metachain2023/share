var DomainUrl = "https://api.kefsc.com"

function getQueryString(name) {
    let reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
    let r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return decodeURIComponent(r[2]);
    };
    return null;
}

var second = 150;

function resetCode(second){
    $('#captcha div').text(second+"s");
    // $("#captcha").css("pointer-events","none");
    $("#captcha").addClass("disabled");

    var timer = null;
    timer = setInterval(function(){
        second -= 1;
        if(second >0 ){
            $('#captcha div').text(second+"s");
        }else{
            clearInterval(timer);
            second = 150;
            $('#captcha div').text("获取验证码");
            $("#captcha").removeClass("disabled");
            // $("#captcha").css("pointer-events","all");
        }
    },1000);
}

$(document).ready(function () {
    let timestamp=parseInt(new Date().getTime()/1000);
    let captchaTs = getStore('captcha_ts');
    if (captchaTs != undefined && captchaTs > timestamp){
        second = captchaTs - timestamp;
        resetCode(second);
    }

    let inviteCode = getQueryString("invite_code");
    if(inviteCode=="" || inviteCode == null){
        alert("无法获取验证码,请确认链接是否正确");
        return false;
    }else {
        $(".invite_code").val(inviteCode);
    }

    $.getJSON("./js/phone_code.json", function(data) {
        //data 代表读取到的json中的数据
        $("#letters").html("");
        $.each(data, function(infoIndex, info) {
            let name = info.name.toUpperCase()
            $("#letters").append(`<li class="letter-item">${name}</li>`)
             $("#namesList").append(`<dt id='${info.name}'>${name}</dt><div class="line"></div>`)
            $.each(info.countrys, function (index,country){
                $("#namesList").append(`<dd>${country.name}<span>${country.number}</span></dd><div class="line"></div>`)
            })
        })

        phoneTouch();
    });

});

$("#changePassword").on('click', function () {
    var src = $(this).find("img").attr("src")
    if (src=="images/icon_eye_close.png"){
        $(this).find("img").attr('src','images/icon_eye_open.png');
        $("#password-input").attr('type','text');
    }else {
        $(this).find("img").attr('src','images/icon_eye_close.png');
        $("#password-input").attr('type','password');
    }
});

function register(){
    var password = $(".password").val();
    var areacode = $(".show-phone-list span").text();
    var phone = $(".phone").val();
    var captcha = $(".captcha").val();
    var inviteCode = $(".invite_code").val();

    if (phone.length<5 || areacode.length<=0){
        msg("请输入正确的手机号");
        return false;
    }
    if(password.length<6 || password.length>20){
        msg("密码长度为6-20位");
        return false;
    }
    if (captcha.length<4 || captcha.length>8){
        msg("验证码有误");
        return false;
    }
    if (inviteCode.length<4){
        msg("邀请码有误");
        return false;
    }

    $("button.register").css("pointer-events","none");

    $.ajax({
        type: "post", // 请求类型（get/post）
        url: DomainUrl+"/api/register",
        async: true, // 是否异步
        dataType: "json", // 设置数据类型
        data:{"password": password,"phone": areacode+"-"+phone,"captcha_code": captcha,"invite_code": inviteCode},
        success: function (data){
            $("button.register").css("pointer-events","all");
            if(data.code==200){
                layer.open({
                    content: "注册成功!",
                    skin: 'msg',
                    time: 3,
                    end: function () {
                        downloadUrl();
                    }
                });
            }else {
                msg(data.msg);
            }
        },
        error: function (errorMsg){
            $("button.register").css("pointer-events","all");
            msg("网络出错,请稍后重试～");
        }
    });
}

function getCaptcha(){
    var phone = $(".phone").val();
    if (!/^1[3-9]\d{9}$/.test(phone)){
        layer.open({
            content: "请输入正确的手机号",
            skin: 'msg',
            time: 2
        });
        return false;
    }

    $("#captcha").css("pointer-events","none");

    $.ajax({
        type: "post", // 请求类型（get/post）
        url: DomainUrl+"/api/captcha",
        async: true, // 是否异步
        dataType: "json", // 设置数据类型
        data: {"username": phone},
        success: function (data){
            $("#captcha").css("pointer-events","all");
            if(data.code==200){
                let timestamp=parseInt(new Date().getTime()/1000);
                setStore('captcha_ts',timestamp+second);
                resetCode(second);
                msg("验证码发送成功~");
            }else {
                msg(data.msg);
            }
        },
        error: function (errorMsg){
            $("#captcha").css("pointer-events","all");
            console.log(errorMsg)
            msg("网络出错,请稍后重试～");
        }
    });
}


function setStore(name, content) {
    if (!name) return;
    if (typeof content !== 'string') {
        content = JSON.stringify(content);
    }
    window.localStorage.setItem(name, content);
}


/**
 * 获取localStorage
 */
function getStore(name, exp) {
    if (!name) return;
    // return JSON.parse(window.localStorage.getItem(name));
    return window.localStorage.getItem(name);

}

function msg(msg){
    layer.open({
        content: msg,
        skin: 'msg',
        time: 2
    });
}

function downloadUrl(){
    location.href = "download.html?channel="+getQueryString("channel");
}

function phoneTouch(){
    // 获取右侧字母DOM
    let letterDom = document.querySelector("#letters")

    // 右侧字母触摸判断逻辑
    letterDom.addEventListener('touchmove', function (e) {
        e.preventDefault()
        //坐标（获取当前触控点的坐标）
        let y = e.touches[0].clientY
        let x = e.touches[0].clientX
        //根据当前纵向坐标控制内容的位置
        let MaxL = letterDom.getBoundingClientRect().left;
        let MaxR = letterDom.getBoundingClientRect().right;
        let MaxT = letterDom.getBoundingClientRect().top
        let MaxB = letterDom.getBoundingClientRect().top + letterDom.getBoundingClientRect().height;
        // 判断是否从一个字母到另一个字母
        if ((x >= MaxL && x <= MaxR) && (y >= MaxT && y <= MaxB) && x && y) {
            let ele = document.elementFromPoint(x, y)
            let eleContent = ele.innerHTML
            clickLetter(eleContent)
        }
        letterDom.removeEventListener("touchend", this, false)
    })

    letterDom.addEventListener("touchend", function (e) {
        letterDom.removeEventListener("touchmove", this, false)
    })

    let letterDoms = document.querySelectorAll('#letters>.letter-item')

    for (let i = 0; i < letterDoms.length; i++) {
        const letterDom = letterDoms[i];
        let letterTmp = letterDom.innerHTML
        letterDom.addEventListener('click',function () {
            clickLetter(letterTmp)
        })
    }

    // 右侧字母点击事件
    function clickLetter(letter) {
        let tmpLetter = letter.toLowerCase()
        let element = window.document.getElementById(tmpLetter)
        element.scrollIntoView()
    }

    $("#namesList").on('click','dd',function (){
        $(".show-phone-list").find("span").text($(this).find("span").text());
        closePhoneCode();
    })
}