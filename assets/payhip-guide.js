(function () {
  "use strict";

  var calculator = document.querySelector("[data-fee-calculator]");
  if (!calculator) return;

  var revenueInput = calculator.querySelector("[data-revenue]");
  var ordersInput = calculator.querySelector("[data-orders]");
  var planInput = calculator.querySelector("[data-plan]");
  var payhipFeeOutput = calculator.querySelector("[data-payhip-fee]");
  var payhipKeepOutput = calculator.querySelector("[data-payhip-keep]");
  var gumroadFeeOutput = calculator.querySelector("[data-gumroad-fee]");
  var gumroadKeepOutput = calculator.querySelector("[data-gumroad-keep]");
  var differenceOutput = calculator.querySelector("[data-difference]");
  var verdictOutput = calculator.querySelector("[data-verdict]");
  var planNameOutput = calculator.querySelector("[data-plan-name]");
  var locale = calculator.getAttribute("data-locale") || "en-US";
  var isSpanish = document.documentElement.lang === "es";

  function safeNumber(value) {
    var number = Number.parseFloat(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  }

  function money(value) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function calculate() {
    var revenue = safeNumber(revenueInput.value);
    var orders = Math.max(0, Math.floor(safeNumber(ordersInput.value)));
    var selectedPlan = planInput.options[planInput.selectedIndex];
    var monthlyPrice = safeNumber(selectedPlan.getAttribute("data-monthly"));
    var transactionRate = safeNumber(selectedPlan.getAttribute("data-rate"));
    var payhipFee = monthlyPrice + revenue * transactionRate;
    var gumroadFee = revenue * 0.1 + orders * 0.5;
    var difference = gumroadFee - payhipFee;

    payhipFeeOutput.textContent = money(payhipFee);
    payhipKeepOutput.textContent = money(revenue - payhipFee);
    gumroadFeeOutput.textContent = money(gumroadFee);
    gumroadKeepOutput.textContent = money(revenue - gumroadFee);
    differenceOutput.textContent = money(Math.abs(difference));
    planNameOutput.textContent = selectedPlan.textContent;

    if (Math.abs(difference) < 0.005) {
      verdictOutput.textContent = isSpanish
        ? "Los costos estimados de plataforma son iguales en este escenario."
        : "Estimated platform costs are equal in this scenario.";
    } else if (difference > 0) {
      verdictOutput.textContent = isSpanish
        ? "Payhip tendría un costo de plataforma estimado menor por " + money(difference) + " al mes."
        : "Payhip would have an estimated platform-cost advantage of " + money(difference) + " per month.";
    } else {
      verdictOutput.textContent = isSpanish
        ? "Gumroad tendría un costo de plataforma estimado menor por " + money(Math.abs(difference)) + " al mes."
        : "Gumroad would have an estimated platform-cost advantage of " + money(Math.abs(difference)) + " per month.";
    }
  }

  calculator.addEventListener("submit", function (event) {
    event.preventDefault();
    calculate();
  });

  [revenueInput, ordersInput, planInput].forEach(function (control) {
    control.addEventListener("input", calculate);
    control.addEventListener("change", calculate);
  });

  calculate();
})();
