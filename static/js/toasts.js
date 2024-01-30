document.addEventListener('DOMContentLoaded', function () {
  const toasts = document.getElementsByClassName('toast');
  Array.from(toasts).forEach((element) => {
    new bootstrap.Toast(element).show();
  });
});
