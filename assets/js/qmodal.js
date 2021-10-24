function performQuiz(selectedTxt) {
    /* Handle audio source */
    window.qModalSelectedText = selectedTxt.replace(/(\r\n|\n|\r)/gm, "");
    /* handleTTS(); // Google prevent CROSS */

    /* handle quiz */
    qModalHandleQuiz();
    resetTotoList();

    /* handle check typing: qModalTxtAreaOnkeyup() */

    document.getElementById('qModal').style.display = 'block';
}

function qModalTxtAreaOnkeyup() {
    /* document.getElementById('sentenceTypeAreaId').value */
    /* window.qModalSelectedText */
    if (window.qModalSelectedText.indexOf(document.getElementById('sentenceTypeAreaId').value) !== 0) {
        document.getElementById("qModalAnswerMsg").style.display = "block";
    } else {
        document.getElementById("qModalAnswerMsg").style.display = "none";
    }
}

function qModalHandleQuiz() {
    if (window.qModalSelectedText) {
        /* preparing: split & shuffle */
        window.arrSplit = window.qModalSelectedText.split(" ");

        qModalResetQuiz();
    }
}
function qModalResetQuiz() {
    window.arrSplitShuffled = shuffleArr(window.arrSplit);

    /* remove all child first */
    document.getElementById("qModalSentenceEmpty").innerHTML = '';
    document.getElementById("qModalSentencePice").innerHTML = '';

    /* reset quiz checking flag */
    window.quizCheckingFlag = 0;

    /* add span to SentencePice div */
    window.arrSplitShuffled.forEach(arrElement => {
        quizSentencePiceAppendElement(arrElement);
    });
}
function quizSentencePiceAppendElement(arrElement) {
    var span = document.createElement("SPAN");
    span.className = "w3-tag w3-border cursor-pointer";
    
    var txt = document.createTextNode(arrElement);
    span.appendChild(txt);

    span.setAttribute("onclick",`answerSpanClicked('${arrElement}', this);`);

    document.getElementById("qModalSentencePice").appendChild(span);
}
function answerSpanClicked(txt, element) {
    /* kiểm tra xem tra lời có đúng ko? nếu đúng thì ẨN span đi và thêm vào EMPTY, không thì hiện aler "không đúng rồi"  */
    if (window.arrSplit.indexOf(txt) == window.quizCheckingFlag) {
        element.style.display = "none";
        quizSentenceEmptyAppendElement(txt);

        if (window.quizCheckingFlag < window.arrSplit.length) {
            window.quizCheckingFlag += 1;
        }
        document.getElementById("qModalAnswerMsg").style.display = "none";
    } else {
        document.getElementById("qModalAnswerMsg").style.display = "block";
    }
}
function quizSentenceEmptyAppendElement(txtElement) {
    var span = document.createElement("SPAN");
    span.className = "w3-tag w3-white";
    
    var txt = document.createTextNode(txtElement);
    span.appendChild(txt);

    document.getElementById("qModalSentenceEmpty").appendChild(span);
}

function qModalGiveUpAndShowAnswer() {
    clearFormTextArea();
    window.arrSplit.forEach(arrElement => {
        quizSentenceEmptyAppendElement(arrElement);
    });
}

function clearFormTextArea() {
    document.getElementById("qModalSentenceEmpty").innerHTML = '';
    document.getElementById("qModalSentencePice").innerHTML = '';
    document.getElementById('sentenceTypeAreaId').value = '';
}
function resetTotoList() {
    try {
        document.getElementById('myUL').childNodes.forEach((el) => { el.classList.remove("checked"); });
    } catch (error) {
        console.log(error);
    }
}

/* https://www.w3schools.com/html/horse.mp3 */
/* https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=AAA */
function qModalAudioControlPlay() {
    if (window.qModalSelectedText && window.qModalAudioObj) {
        try {
            window.qModalAudioObj.play();
        } catch (error) {
            console.log(error);
        }
    } else {
        window.open("https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=" + window.qModalSelectedText);
    }
}
function qModalChangeAudioControlIcon(icon) {
    if (document.getElementById("qModalAudioControlEl")) {
        document.getElementById("qModalAudioControlEl").innerHTML = icon;
    }
}
function handleTTS() {
    if (!window.qModalAudioObj) {
        window.qModalAudioObj = new Audio();
        window.qModalAudioObj.onplay = function () {
            qModalChangeAudioControlIcon('pause');
        };
        window.qModalAudioObj.onended = function () {
            qModalChangeAudioControlIcon('play_arrow');
        };
    }
    window.qModalAudioObj.src = "https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q=" + window.qModalSelectedText;
}

/* Utils */
function shuffleArr(array) {
    var arrayCopy = [...array];
    var currentIndex = arrayCopy.length, temporaryValue, randomIndex;

    /* While there remain elements to shuffle... */
    while (0 !== currentIndex) {

        /* Pick a remaining element... */
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        /* And swap it with the current element. */
        temporaryValue = arrayCopy[currentIndex];
        arrayCopy[currentIndex] = arrayCopy[randomIndex];
        arrayCopy[randomIndex] = temporaryValue;
    }

    return arrayCopy;
}