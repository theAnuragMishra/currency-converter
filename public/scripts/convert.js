const from = document.getElementById('from');
const to = document.getElementById('to');
const amount = document.getElementById('amountInput');
const result = document.getElementById('resultDiv');
let topText = document.getElementById("topText");
let favFrom = document.getElementById("fav-from");
let favTo = document.getElementById("fav-to");
let arrowImage = document.getElementById("arrowImage");
let convertButton = document.getElementById("convertBtn");
let fromFlag = document.getElementById("fromFlag");
let toFlag = document.getElementById("toFlag");

from.value = "INR";
to.value = "USD";

// Event Listeners
convertButton.addEventListener('click', () => {
    animateConvertButton();
    animateResult();
    let fromCurrency = from.value;
    let toCurrency = to.value;
    if(fromCurrency.length >3){fromCurrency = fromCurrency.slice(1,4);}
    if(toCurrency.length >3){toCurrency = toCurrency.slice(1,4);}
 fetch(`/conversion?amount=${amount.value}&from=${fromCurrency}&to=${toCurrency}`)
    .then(response => response.json())
    .then(data => {
      result.value = data.convertedAmount;

      fetch('/add-to-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({from:fromCurrency, to: toCurrency, amount: amount.value, result:result.value}),
      })
      .then(response => response.text())
      .then(data => {
        console.log('Server response:', data);
      })
      .catch(error => {
        console.error('Error:', error);
      });
    })
    .catch(error => console.error('Error:', error));


})

from.addEventListener("change", () => {
topText.innerText = from.value + " to " + to.value;
});

to.addEventListener("change", () => {
topText.innerText = from.value + " to " + to.value;
});

arrowImage.addEventListener("click", () => {
  animateArrow();
  [from.value, to.value] = [to.value, from.value];
  topText.innerText = from.value + " to " + to.value;
   [amount.value, result.value] = ["", ""];
   [fromFlag.src, toFlag.src] = [toFlag.src, fromFlag.src];
});

favFrom.addEventListener("click", () => {
    let fromCurrency = from.value;
    if(fromCurrency.length >3){fromCurrency = fromCurrency.slice(1,4);}
    fetch('/add-to-favorites-from', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({currency:fromCurrency}),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

favTo.addEventListener("click", () => {
    let toCurrency = to.value;
    if(toCurrency.length >3){toCurrency = toCurrency.slice(1,4);}
    fetch('/add-to-favorites-to', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify({currency:toCurrency}),
    })
    .then(response => response.text())
    .then(data => {
        console.log('Server response:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });
});

// misc

    window.onload = resetSelectBoxes;

// Functions


    function animateArrow() {
    arrowImage.classList.add("animate__animated", "animate__flipInY");

  setTimeout(() => {
    arrowImage.classList.remove("animate__animated", "animate__flipInY");
  }, 1000);
    }

    function animateConvertButton() {
    convertButton.classList.add("animate__animated", "animate__pulse");

    setTimeout(() => {
        convertButton.classList.remove("animate__animated", "animate__pulse");
    }, 1000);
    }

    function animateResult() {
    result.classList.add("animate__animated", "animate__pulse");

    setTimeout(() => {
        result.classList.remove("animate__animated", "animate__pulse");
    }, 1000);
    }

    function resetSelectBoxes() {
    from.value = "INR";
to.value = "USD";
    }