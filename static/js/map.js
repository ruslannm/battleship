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
  const data = serializeForm(mapPlacementForm);
  handleCheck(data, event, ruleInvalidMessage, 'rule');
  handleCheck(data, event, cellsInvalidMessage, 'cells');
}

const ruleInvalidMessage = document.getElementById('rule-invalid-message');
const cellsInvalidMessage = document.getElementById('cells-invalid-message');

const mapPlacementForm = document.getElementById('map-placement');
mapPlacementForm.addEventListener('submit', handleFormSubmit, false);
