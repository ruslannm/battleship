function isGroupChecked(data, groupName) {
  let result = false;
  data.forEach(function (item) {
    if (item['name'] === groupName) {
      result = true;
    }
  });
  return result;
}

function handleCheck(data, event, element, groupName) {
  if (isGroupChecked(data, groupName)) {
    element.style.display = 'none';
  } else {
    element.style.display = '';
    event.preventDefault();
    event.stopPropagation();
  }
}

function serializeForm(formNode) {
  const { elements } = formNode;
  const data = Array.from(elements)
    .map((element) => {
      const { name, type, value } = element;
      const checked =
        type === 'checkbox' || type === 'radio'
          ? element.checked
          : element.value;
      return { name, value, checked };
    })
    .filter((item) => !!item.name)
    .filter((item) => item.checked === true);
  return data;
}

function handleFormSubmit(event) {
  if (submitMapButton.innerText === 'Начать игру') {
    console.log('submitMapButton', submitMapButton);
    console.log(`submitMapButton=${submitMapButton.innerText}=`);
    console.log(`value=${submitMapButton.value}=`);
    console.log(`/game/${submitMapButton.value}`);
    window.location.replace(`/game/${submitMapButton.value}`);
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  const data = serializeForm(mapPlacementForm);
  handleCheck(data, event, ruleInvalidMessage, 'sheepId');
  handleCheck(data, event, cellsInvalidMessage, 'cells');
}

const ruleInvalidMessage = document.getElementById('rule-invalid-message');
const cellsInvalidMessage = document.getElementById('cells-invalid-message');

const submitMapButton = document.getElementById('submit-map');

const mapPlacementForm = document.getElementById('map-placement');
mapPlacementForm.addEventListener('submit', handleFormSubmit, false);

const resetMapButton = document.getElementById('reset-map');
resetMapButton.addEventListener('click', handleResetMap, false);

function handleResetMap() {
  fetch(`/game/${resetMapButton.value}`, {
    method: 'PUT',
  }).then(() => {
    window.location.reload();
  });
}

const tooltipTriggerList = [].slice.call(
  document.querySelectorAll('[data-bs-toggle="tooltip"]'),
);
const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl);
});
