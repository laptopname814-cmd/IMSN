/**
 * Database Connector - Connects any page to the inventory server
 * Include this script in any HTML page to enable automatic data syncing
 */

const DBConnector = {
  serverURL: (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') ? window.location.origin : 'http://localhost:5000',

  /**
   * Save any data to the server
   * @param {Object} data - The data to save
   * @param {String} category - Optional category/type of data
   * @returns {Promise}
   */
  async saveData(data, category = 'general') {
    try {
      const payload = {
        ...data,
        category,
        savedAt: new Date().toISOString()
      };

      const response = await fetch(`${this.serverURL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      console.log(`✓ Data saved to server (Record #${result.record_id})`);
      return result;
    } catch (error) {
      console.error('Error saving to server:', error);
      alert('Error saving to server. Please check server connection.');
      return null;
    }
  },

  /**
   * Get all stored records from the server
   * @returns {Promise<Array>}
   */
  async getRecords() {
    try {
      const response = await fetch(`${this.serverURL}/records`);
      const result = await response.json();
      return result.records || [];
    } catch (error) {
      console.error('Error fetching records:', error);
      return [];
    }
  },

  /**
   * Get records filtered by category
   * @param {String} category - Category to filter by
   * @returns {Promise<Array>}
   */
  async getRecordsByCategory(category) {
    const records = await this.getRecords();
    return records.filter(r => r.payload.category === category);
  },

  /**
   * Auto-sync form data on submit
   * Usage: Add this to your form's onsubmit handler
   * @param {Event} event - Form submit event
   * @param {String} category - Category for the data
   */
  autoSyncForm(event, category) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    this.saveData(data, category).then(() => {
      form.reset();
      alert('Data saved successfully!');
    });
  },

  /**
   * Create a save button that automatically syncs form data
   * Usage: <button onclick="DBConnector.syncFormButton(this, 'customer')">Save</button>
   * @param {Element} button - The button element
   * @param {String} category - Category for the data
   */
  syncFormButton(button, category) {
    const form = button.closest('form');
    if (form) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);
      this.saveData(data, category).then(result => {
        if (result) {
          alert(`Saved successfully! Record ID: ${result.record_id}`);
          form.reset();
        }
      });
    } else {
      alert('Button must be inside a form');
    }
  },

  /**
   * Load and display all records in a table
   * @param {String} tableSelector - CSS selector for the table
   * @param {String} filterCategory - Optional category to filter
   */
  async populateTable(tableSelector, filterCategory = null) {
    let records = await this.getRecords();
    
    if (filterCategory) {
      records = records.filter(r => r.payload.category === filterCategory);
    }

    const table = document.querySelector(tableSelector);
    if (!table) return;

    const tbody = table.querySelector('tbody') || table;
    tbody.innerHTML = '';

    if (records.length === 0) {
      tbody.innerHTML = '<tr><td colspan="10">No records found</td></tr>';
      return;
    }

    records.forEach(record => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.id}</td>
        <td>${JSON.stringify(record.payload).substring(0, 100)}...</td>
        <td>${new Date(record.created_at).toLocaleDateString()}</td>
      `;
      tbody.appendChild(row);
    });
  },

  /**
   * Check server connection status
   * @returns {Promise<Boolean>}
   */
  async checkConnection() {
    try {
      const response = await fetch(`${this.serverURL}/status`);
      return response.ok;
    } catch (error) {
      console.error('Server not reachable:', error);
      return false;
    }
  },

  /**
   * Initialize connection check on page load
   */
  initConnectionCheck() {
    this.checkConnection().then(isConnected => {
      const status = document.getElementById('serverConnectionStatus');
      if (status) {
        if (isConnected) {
          status.innerHTML = '🟢 Server Connected';
          status.style.color = '#16a085';
        } else {
          status.innerHTML = '🔴 Server Not Connected';
          status.style.color = '#c0392b';
        }
      }
    });
  }
};

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  DBConnector.initConnectionCheck();
});
