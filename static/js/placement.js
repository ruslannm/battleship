const ship = {
  element: false,
  shipLength: false,
  firstCell: false,
  secondCell: false,
};
const shipElements = document.querySelectorAll('.ship');
// console.log(ship);
shipElements.forEach((element) => {
  element.addEventListener('click', handleChooseShip, false);
});

function removeButtonClasses(elements) {
  elements.forEach((element) => {
    ['btn', 'btn-primary', 'btn-outline-primary', 'rounded-0'].forEach((cl) =>
      element.classList.remove(cl),
    );
  });
}

function addButtonClasses(elements) {
  addClasses(elements, ['btn', 'btn-outline-primary', 'rounded-0']);
}

function addClasses(elements, classes) {
  elements.forEach((element) => {
    classes.forEach((cl) => element.classList.add(cl));
  });
}
function addDivClasses(elements) {
  addClasses(elements, ['border', 'border-primary']);
}

function handleChooseShip(event) {
  const id = event.target.id;
  const shipElement = document.getElementById(id);
  const isPressed = shipElement.classList.contains('btn-primary');
  if (isPressed) {
    shipElement.classList.remove('btn-primary');
    shipElement.classList.add('btn-outline-primary');
    ship.element = false;
    ship.shipLength = false;
    removeButtonClasses(cellElements);
    cellElements.forEach((element) => {
      element.removeEventListener('click', handleChooseCell, false);
    });
  } else {
    shipElements.forEach((element) => {
      element.classList.remove('btn-primary');
      element.classList.add('btn-outline-primary');
    });
    shipElement.classList.remove('btn-outline-primary');
    shipElement.classList.add('btn-primary');
    ship.shipLength = shipElement.getAttribute('value');
    ship.element = shipElement;
    addButtonClasses(cellElements);
    cellElements.forEach((element) => {
      element.addEventListener('click', handleChooseCell, false);
    });
  }
  console.log(ship);
}

const cellElements = document.querySelectorAll('.btn-cell');
// cellElements.forEach((element) => {
//   element.addEventListener('click', handleChooseCell, false);
// });

function handleChooseCell(event) {
  const id = event.target.id;
  const cellElement = document.getElementById(id);
  cellElement.classList.remove('btn-outline-primary');
  cellElement.classList.add('btn-primary');
  if (ship.firstCell) {
    ship.secondCell = cellElement.getAttribute('value');
    console.log('Пробуем поставить корабль');
    handlePlaceShip();
  } else {
    console.log('выбрали первую клетку');
    ship.firstCell = cellElement.getAttribute('value');
    removeButtonClasses(shipElements);
    addDivClasses(shipElements);
    ship.element.classList.add('bg-primary');
    shipElements.forEach((element) => {
      element.removeEventListener('click', handleChooseShip, false);
    });
  }
  console.log(ship);
}

function handlePlaceShip() {
  fetch(`placements`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({
      shipLength: ship.shipLength,
      firstCell: ship.firstCell,
      secondCell: ship.secondCell,
    }),
  })
    .then(() => {
      // console.log(res);
      window.location.reload();
    })
    .catch((e) => console.log('Error', e));
}
