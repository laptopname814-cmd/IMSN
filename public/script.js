const payloadInput = document.getElementById('payload');
const saveButton = document.getElementById('saveButton');
const loadRecordsButton = document.getElementById('loadRecordsButton');
const saveStatus = document.getElementById('saveStatus');
const recordsOutput = document.getElementById('recordsOutput');

async function saveRecord() {
  let payload;
  try {
    payload = JSON.parse(payloadInput.value);
  } catch (error) {
    saveStatus.textContent = 'Invalid JSON. Please fix the payload.';
    saveStatus.style.color = '#c0392b';
    return;
  }

  saveStatus.textContent = 'Saving...';
  saveStatus.style.color = '#333';

  try {
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();

    if (!response.ok) {
      saveStatus.textContent = result.message || 'Save failed';
      saveStatus.style.color = '#c0392b';
      return;
    }

    saveStatus.textContent = `Saved record #${result.record_id}`;
    saveStatus.style.color = '#16a085';
    payloadInput.value = '';
  } catch (error) {
    saveStatus.textContent = 'Server error: ' + error.message;
    saveStatus.style.color = '#c0392b';
  }
}

async function loadRecords() {
  recordsOutput.textContent = 'Loading records...';

  try {
    const response = await fetch('/records');
    const result = await response.json();

    if (!response.ok) {
      recordsOutput.textContent = result.message || 'Failed to load records.';
      return;
    }

    if (!result.records || result.records.length === 0) {
      recordsOutput.textContent = 'No records found.';
      return;
    }

    recordsOutput.textContent = JSON.stringify(result.records, null, 2);
  } catch (error) {
    recordsOutput.textContent = 'Server error: ' + error.message;
  }
}

saveButton.addEventListener('click', saveRecord);
loadRecordsButton.addEventListener('click', loadRecords);
