// Table sorting
(function () {
  const table = document.getElementById('jobsTable');
  if (!table) return;

  let sortCol = -1;
  let sortAsc = true;

  table.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const col = parseInt(th.dataset.col);
      if (sortCol === col) {
        sortAsc = !sortAsc;
      } else {
        sortCol = col;
        sortAsc = true;
      }

      table.querySelectorAll('th.sortable').forEach(h => {
        h.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');

      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const av = a.cells[col]?.textContent.trim() ?? '';
        const bv = b.cells[col]?.textContent.trim() ?? '';
        return sortAsc ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr');
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
})();

// Delete job buttons
document.querySelectorAll('.btn-delete').forEach(btn => {
  btn.addEventListener('click', async function () {
    const jobId = this.dataset.jobId;
    if (!confirm('Bu ilanı silmek istediğine emin misin?')) return;

    const resp = await fetch(`/jobs/${jobId}/delete`, { method: 'POST' });
    if (resp.ok) {
      const row = document.querySelector(`tr[data-job-id="${jobId}"]`);
      if (row) row.remove();
    }
  });
});
