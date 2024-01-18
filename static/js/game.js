const closeGameButton = document.getElementById('close-game');
closeGameButton.addEventListener('click', handleCloseGame, false);

function handleCloseGame() {
  fetch(`/game/${closeGameButton.value}`, {
    method: 'DELETE',
  })
    .then((responce) => responce.json())
    .then((result) => {
      // console.log('result', result);
      if (result['href'] === window.location.href) {
        // window.location.reload();
        console.log('reload');
      } else {
        // console.log('replace');
        window.location.replace(result['href']);
      }
    })
    .catch((e) => console.log('Error', e));
}
