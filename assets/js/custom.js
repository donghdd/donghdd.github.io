// When document ready
function documentReady() {
  try {
    openAudioControl();
  } catch (error) { }
  var tocnavElm = document.getElementsByClassName("toc-nav")[0];
  if (tocnavElm) {
    tocnavElm.addEventListener('click', () => {
      tocnavElm.style.display = 'none';
    });
  }
  try {
    mermaid.initialize({
      startOnLoad: true,
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true
      }
    });
  } catch (error) { }
  applyEventsForAudios();
  try {
    window.quillEditor = new Quill('#quillNoteEditor', {
      theme: 'snow',
      placeholder: 'Bạn có thể viết ghi chú ở đây!',
    });
    window.quillEditor.setHTML = (html) => {
      window.quillEditor.root.innerHTML = html;
    };
    window.quillEditor.getHTML = () => {
      return window.quillEditor.root.innerHTML;
    };
    loadMemo();
  } catch (error) { }
}

// Open and close Menu
function toggleMenu() {
  if (document.getElementById("menuElm").style.display === "block") {
    document.getElementById("menuIcon").innerHTML = "menu";
    document.getElementById("menuElm").style.display = "none";
  } else {
    document.getElementById("menuIcon").innerHTML = "close";
    document.getElementById("menuElm").style.width = "100%";
    document.getElementById("menuElm").style.display = "block";
  }
}

function toggleTOC() {
  var tocnavElement = document.getElementsByClassName("toc-nav")[0];
  if (tocnavElement) {
    if (tocnavElement.style.display === "block") {
      tocnavElement.style.display = "none";
    } else {
      tocnavElement.style.display = "block";
      tocnavElement.style.top = "0px";
    }
  }
}

// Scroll to top
const scrollTopBtn = document.getElementById("scrollTopBtn");
const tocMenu = document.getElementById("tocMenu");
// Hide menu on scroll
var prevScrollpos = window.pageYOffset;

window.onscroll = function scrollFunction() {
  // go to top
  if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
    scrollTopBtn.style.display = "block";
  } else {
    scrollTopBtn.style.display = "none";
  }

  // hide menu on scroll
  var currentScrollPos = window.pageYOffset;
  if (prevScrollpos > currentScrollPos) {
    document.getElementById("navbar").style.top = "0";
    if (tocMenu) tocMenu.classList.remove("opacity-transition-hover");
    if (scrollTopBtn) scrollTopBtn.classList.remove("opacity-transition-hover");
  } else {
    document.getElementById("navbar").style.top = "-62px";
    if (tocMenu) tocMenu.classList.add("opacity-transition-hover");
    if (scrollTopBtn) scrollTopBtn.classList.add("opacity-transition-hover");
  }
  prevScrollpos = currentScrollPos;

  // scroll indicator
  var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  var scrolled = (winScroll / height) * 100;
  var progressBar = document.getElementById("progressBar")
  if (progressBar) progressBar.style.width = scrolled + "%";

  //spy title
  var titles = document.querySelectorAll('[spy-title]');
  var tocs = document.querySelectorAll('[spy-toc]');
  titles.forEach(title => {
    var rect = title.getBoundingClientRect();
    if (document.documentElement.clientHeight > rect.top) {
      tocs.forEach(toc => {
        if (title.hash === toc.hash) {
          toc.classList.add("w3-border-bottom", "w3-border-red");
        } else {
          toc.classList.remove("w3-border-bottom", "w3-border-red");
        }
      });
    }
  });
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
  document.body.scrollTop = 0; // For Safari
  document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE and Opera
}

function gotoBottom() {
  window.scrollTo(0, document.body.scrollHeight || document.documentElement.scrollHeight);
}

// Img Modal
function onZoomImg(element) {
  document.getElementById("imgModal").src = element.src;
  document.getElementById("zoomModal").style.display = "block";
}

// audio custom
function openAudioSettings() {
  document.getElementById('audioSettings').style.display = 'block';
}

/**
 * Ưu tiên: Repeat > Next > Random
 * Phần này chỉ xử lý logic uncheck và apply rate, còn đâu ended event đã xử lý audio tiếp theo sẽ là gì...
 */
function onClickApplyAs() {
  var audios = document.getElementsByTagName('audio');
  var asSpeed = document.getElementById('asSpeedSelect');
  var asRepeat = document.getElementById('asRepeatCheck');
  var asRandom = document.getElementById('asRandomCheck');
  var asAutoNext = document.getElementById('asAutoNextCheck');
  if (audios) {
    for (let i = 0; i < audios.length; i++) {
      audios.item(i).playbackRate = asSpeed.value;
      // uncheck repeat
      audios.item(i).loop = false;
    }
    if (asRepeat.checked) {
      asAutoNext.checked = false;
      asRandom.checked = false;
    } else if (asAutoNext.checked) {
      asRandom.checked = false;
    }
  }
  document.getElementById('audioSettings').style.display = 'none';
}

function applyEventsForAudios() {
  var audios = document.getElementsByTagName('audio');
  if (audios) {
    window.audioList = audios;
    window.audiosLength = audios.length;
    for (let i = 0; i < audios.length; i++) {
      if (!window.addedEventListenerFlag) {
        // ended
        audios.item(i).addEventListener('ended', () => {
          console.log('audio ended =>', i);
          handleAudioEnd(audios, i, audios.length);
        });
        // play
        audios.item(i).addEventListener('play', () => {
          console.log('audio play =>', i);
          window.audioCurrentIndex = i;
          handleAudioPlay(audios, i, audios.length);
        });
        // pause
        audios.item(i).addEventListener('pause', () => {
          console.log('audio pause =>', i);
          handleAudioPause(audios, i, audios.length);
        });
      }
    }
    window.addedEventListenerFlag = true;
    window.currentAudioPlaying = audios.item(0);
  }
}

function resetCurrentAudio() {
  if (window.currentAudioPlaying) {
    window.currentAudioPlaying.currentTime = 0;
  }
}

function skipCurrentAudioAndNext() {
  if (window.currentAudioPlaying) {
    window.currentAudioPlaying.currentTime = 0; // reset
    window.currentAudioPlaying.pause(); // pause
    window.currentAudioPlaying = window.audioList.item(forceNext());
    window.currentAudioPlaying.scrollIntoView();
    window.currentAudioPlaying.play();
  }
}

function forceNext() {
  console.log('forceNext => ', window.audioCurrentIndex, window.audiosLength);
  var nextIndex = window.audioCurrentIndex + 1;
  if (nextIndex >= window.audiosLength) {
    nextIndex = 0;
  }
  return nextIndex;
}

function handleAudioEnd(audios, currentIndex, audiosLength) {
  window.currentAudioPlaying = audios.item(getNextAudio(currentIndex, audiosLength));
  window.currentAudioPlaying.scrollIntoView();
  window.currentAudioPlaying.play();
}

function isOdd(num) { return num % 2; }

/**
 * Ưu tiên Repeat > Auto Next > Random
 */
function getNextAudio(currentIndex, audiosLength) {
  var nextIndex = currentIndex + 1;
  if (document.getElementById('asRepeatCheck').checked) {
    return currentIndex;
  }
  if (document.getElementById('asAutoNextCheck').checked) {
    if (nextIndex >= audiosLength) {
      nextIndex = 0;
    }
    // check ItemToItem (even or odd) here
    if (document.getElementById('asPlayItemToItem').checked) {
      if (document.getElementById('asEvenOrOdd').value === 'odd') {
        if (isOdd(nextIndex)) {
          return nextIndex;
        }
        return getNextAudio(nextIndex, audiosLength);
      } else {
        if (!isOdd(nextIndex)) {
          return nextIndex;
        }
        return getNextAudio(nextIndex, audiosLength);
      }
    }
    return nextIndex;
  }
  if (document.getElementById('asRandomCheck').checked) {
    return randomIndex(0, audiosLength);
  }
  return currentIndex;
}

function randomIndex(min, max) {
  return Math.floor(Math.random() * (max + 1)) + min;
}

function onClickGotoCurrentAudio() {
  if (window.currentAudioPlaying) {
    window.currentAudioPlaying.scrollIntoView();
    document.getElementById('audioSettings').style.display = 'none';
  }
}

function onClickShowAudioControl() {
  if (document.getElementById("audioControlGroup")) {
    if (!window.audioControlIsShow) {
      document.getElementById("audioControlGroup").style.display = "block";
      window.audioControlIsShow = true;
    } else {
      document.getElementById("audioControlGroup").style.display = "none";
      window.audioControlIsShow = false;
    }
    document.getElementById('audioSettings').style.display = 'none';
  }
}
function audioControlPlayOrPause() {
  if (window.currentAudioPlaying) {
    if (window.currentAudioStatusIsPlaying) {
      // pause now
      window.currentAudioPlaying.pause();
      // change icon
      changeAudioControlIcon('play_arrow');
    } else {
      // play now
      window.currentAudioPlaying.play();
      // change icon
      changeAudioControlIcon('pause');
    }
  }
}
function audioControlPlus() {
  if (window.currentAudioPlaying) {
    window.currentAudioPlaying.currentTime = window.currentAudioPlaying.currentTime + parseInt(document.getElementById('plusMinusAmount').value);
  }
}
function audioControlMinus() {
  if (window.currentAudioPlaying) {
    window.currentAudioPlaying.currentTime = window.currentAudioPlaying.currentTime - parseInt(document.getElementById('plusMinusAmount').value);
  }
}
function handleAudioPlay(audios, currentIndex, audiosLength) {
  window.currentAudioPlaying = audios.item(currentIndex);
  // update status
  window.currentAudioStatusIsPlaying = true;
  // change icon
  changeAudioControlIcon('pause');
}
function handleAudioPause(audios, currentIndex, audiosLength) {
  // update status
  window.currentAudioStatusIsPlaying = false;
  // change icon
  changeAudioControlIcon('play_arrow');
}
// play_arrow | pause
function changeAudioControlIcon(icon) {
  if (document.getElementById("audioControlEl")) {
    document.getElementById("audioControlEl").innerHTML = icon;
  }
}

// speech (experiment): "articleBody"
function get_content(id) {
  var html = document.getElementById(id).innerHTML;
  return html.replace(/<[^>]*>/g, "");
}
function say(m) {
  var msg = new SpeechSynthesisUtterance();
  var voices = window.speechSynthesis.getVoices();
  msg.voice = voices[10];
  msg.voiceURI = "native";
  msg.volume = 1;
  msg.rate = 1;
  msg.pitch = 0.8;
  msg.text = m;
  msg.lang = document.getElementById('asLangSay').value;
  speechSynthesis.speak(msg);
}

// tabs in articles
function openTab(volumeTxt, activateTxt, deactivateTxt) {
  try {
    var activateId = activateTxt + '-' + volumeTxt;
    var deactivateId = deactivateTxt + '-' + volumeTxt;

    document.getElementById(deactivateId).style.display = "none";
    document.getElementById(deactivateId + '-tab').className = document.getElementById(deactivateId + '-tab').className.replace(" w3-red", "");
    document.getElementById(activateId + '-tab').className = document.getElementById(activateId + '-tab').className.replace(" w3-red", "");

    document.getElementById(activateId).style.display = "block";
    document.getElementById(activateId + '-tab').className += " w3-red";
  } catch (error) {
    console.log(error);
  }
}

function getSelectionText() {
  var text = "";
  var activeEl = document.activeElement;
  var activeElTagName = activeEl ? activeEl.tagName.toLowerCase() : null;
  if (
    (activeElTagName == "textarea") || (activeElTagName == "input" &&
    /^(?:text|search|password|tel|url)$/i.test(activeEl.type)) &&
    (typeof activeEl.selectionStart == "number")
  ) {
      text = activeEl.value.slice(activeEl.selectionStart, activeEl.selectionEnd);
  } else if (window.getSelection) {
      text = window.getSelection().toString();
  }
  return text;
}

// BEGIN Konami Code
// var pattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
var pattern = ['w', 'w', 's', 's', 'a', 'd', 'a', 'd', 'e', 'r'];
var current = 0;

var keyHandler = function (event) {
  // BEGIN - if [Q]uery
  if (['q', 'Q'].indexOf(event.key) >= 0) {
    var selectedTxt = getSelectionText();
    if (!selectedTxt) {
      console.log('Empty....');
    } else {
      try {
        performQuiz(selectedTxt);
      } catch (error) {
        console.log(error);        
      }
    }
  }
  // END - if [Q]uery

  // If the key isn't in the pattern, or isn't the current key in the pattern, reset
  if (pattern.indexOf(event.key) < 0 || event.key !== pattern[current]) {
    current = 0;
    return;
  }

  // Update how much of the pattern is complete
  current++;

  // If complete, action and reset
  if (pattern.length === current) {
    current = 0;
    try {
      for (let item of document.getElementsByClassName('konamiHide')) {
        item.style.display = 'initial';
      }
      document.getElementById('inputCheat').style.display = 'none';
    } catch (error) { }
  }

};

// Listen for keydown events
document.addEventListener('keydown', keyHandler, false);
// END Konami Code