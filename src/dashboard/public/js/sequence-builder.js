// Sequence Builder JavaScript

// State
let currentSequenceId = null;
let nodes = [];
let connections = [];
let selectedNode = null;
let selectedConnection = null;
let isDragging = false;
let isConnecting = false;
let connectingFrom = null;
let dragOffset = { x: 0, y: 0 };
let zoom = 1;
let pan = { x: 0, y: 0 };
let nodeIdCounter = 0;
let hasUnsavedChanges = false;

// Initialize
async function initSequenceBuilder() {
  await loadSequencesList();
  await loadTemplates();
  setupDragAndDrop();
  setupCanvasInteractions();
  setupKeyboardShortcuts();

  // Check for sequence ID in URL
  const params = new URLSearchParams(window.location.search);
  const sequenceId = params.get('id');
  if (sequenceId) {
    document.getElementById('sequenceSelect').value = sequenceId;
    loadSequence(sequenceId);
  }
}

// Load sequences list
async function loadSequencesList() {
  try {
    const sequences = await api('/api/campaigns/sequences');
    const select = document.getElementById('sequenceSelect');

    select.innerHTML = '<option value="">-- Select Sequence --</option>';
    sequences.forEach(seq => {
      const option = document.createElement('option');
      option.value = seq.id;
      option.textContent = seq.name;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load sequences:', error);
  }
}

// Load templates
async function loadTemplates() {
  try {
    const templates = await api('/api/campaigns/templates');
    const list = document.getElementById('templatesList');

    if (templates.length === 0) {
      list.innerHTML = '<p class="empty">No templates available</p>';
      return;
    }

    list.innerHTML = templates.map(t => `
      <div class="template-item" onclick="insertTemplate('${escapeHtml(t.name)}')">${escapeHtml(t.name)}</div>
    `).join('');
  } catch (error) {
    document.getElementById('templatesList').innerHTML = '<p class="error">Failed to load</p>';
  }
}

// Load sequence
async function loadSequence(sequenceId) {
  if (!sequenceId) {
    clearCanvas();
    return;
  }

  if (hasUnsavedChanges) {
    const confirmed = await confirmAction('You have unsaved changes. Discard them?');
    if (!confirmed) {
      document.getElementById('sequenceSelect').value = currentSequenceId || '';
      return;
    }
  }

  try {
    const data = await api(`/api/campaigns/sequences/${sequenceId}/visual`);

    currentSequenceId = sequenceId;
    document.getElementById('sequenceName').textContent = data.name || 'Untitled Sequence';

    // Load layout
    if (data.layout) {
      nodes = data.layout.nodes || [];
      connections = data.layout.connections || [];

      // Update node ID counter
      nodes.forEach(n => {
        const match = n.id.match(/\d+$/);
        if (match) {
          nodeIdCounter = Math.max(nodeIdCounter, parseInt(match[0]) + 1);
        }
      });
    } else {
      nodes = [];
      connections = [];
    }

    renderCanvas();
    validateSequence();
    hasUnsavedChanges = false;

    // Update URL
    window.history.replaceState({}, '', `?id=${sequenceId}`);
  } catch (error) {
    showToast(`Failed to load sequence: ${error.message}`, 'error');
  }
}

// Clear canvas
function clearCanvas() {
  nodes = [];
  connections = [];
  currentSequenceId = null;
  selectedNode = null;
  selectedConnection = null;
  document.getElementById('sequenceName').textContent = 'Untitled Sequence';
  document.getElementById('propertiesContent').innerHTML =
    '<p class="empty">Select a node to edit its properties</p>';
  renderCanvas();
  window.history.replaceState({}, '', window.location.pathname);
}

// Render canvas
function renderCanvas() {
  const canvas = document.getElementById('canvas');
  const connectionsLayer = document.getElementById('connectionsLayer');

  // Clear existing nodes (keep grid)
  const existingNodes = canvas.querySelectorAll('.sequence-node');
  existingNodes.forEach(n => n.remove());

  // Clear empty state
  const emptyState = canvas.querySelector('.canvas-empty');
  if (emptyState) emptyState.remove();

  // Show empty state if no nodes
  if (nodes.length === 0) {
    canvas.innerHTML += `
      <div class="canvas-empty">
        <div class="icon">🔗</div>
        <h3>Start Building Your Sequence</h3>
        <p>Drag components from the left panel onto the canvas to create your email sequence.</p>
      </div>
    `;
  }

  // Render nodes
  nodes.forEach(node => {
    const nodeEl = createNodeElement(node);
    canvas.appendChild(nodeEl);
  });

  // Render connections
  renderConnections();
}

// Create node element
function createNodeElement(node) {
  const el = document.createElement('div');
  el.className = `sequence-node ${node.type} ${selectedNode?.id === node.id ? 'selected' : ''}`;
  el.dataset.nodeId = node.id;
  el.style.left = node.x + 'px';
  el.style.top = node.y + 'px';

  const icon = getNodeIcon(node.type);
  const title = getNodeTitle(node);
  const subtitle = getNodeSubtitle(node);

  el.innerHTML = `
    <div class="connection-point input" data-point="input"></div>
    <div class="node-header">
      <span class="node-icon">${icon}</span>
      <span class="node-type">${node.type}</span>
    </div>
    <div class="node-content">
      <div class="node-title">${escapeHtml(title)}</div>
      ${subtitle ? `<div class="node-subtitle">${escapeHtml(subtitle)}</div>` : ''}
    </div>
    <div class="node-actions">
      <button onclick="editNode('${node.id}')">Edit</button>
      <button class="delete" onclick="deleteNode('${node.id}')">Delete</button>
    </div>
    <div class="connection-point output" data-point="output"></div>
  `;

  // Node drag handlers
  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('.node-actions') || e.target.closest('.connection-point')) return;
    startDragging(node, e);
  });

  // Connection point handlers
  el.querySelectorAll('.connection-point').forEach(point => {
    point.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      if (point.dataset.point === 'output') {
        startConnecting(node, e);
      }
    });

    point.addEventListener('mouseup', (e) => {
      if (isConnecting && point.dataset.point === 'input') {
        finishConnecting(node);
      }
    });
  });

  // Select on click
  el.addEventListener('click', (e) => {
    if (!isDragging && !e.target.closest('.node-actions')) {
      selectNode(node);
    }
  });

  return el;
}

function getNodeIcon(type) {
  const icons = { email: '📧', delay: '⏱️', condition: '🔀', end: '🏁' };
  return icons[type] || '📦';
}

function getNodeTitle(node) {
  switch (node.type) {
    case 'email':
      return node.data?.subject || 'Untitled Email';
    case 'delay':
      return `Wait ${node.data?.days || 0} days`;
    case 'condition':
      return node.data?.condition || 'Check condition';
    case 'end':
      return 'End Sequence';
    default:
      return 'Node';
  }
}

function getNodeSubtitle(node) {
  switch (node.type) {
    case 'email':
      return node.data?.template ? 'Template set' : 'No template';
    case 'condition':
      return node.data?.condition ? `If ${node.data.condition}` : '';
    default:
      return '';
  }
}

// Render connections
function renderConnections() {
  const svg = document.getElementById('connectionsLayer');
  svg.innerHTML = '';

  connections.forEach(conn => {
    const fromNode = nodes.find(n => n.id === conn.from);
    const toNode = nodes.find(n => n.id === conn.to);
    if (!fromNode || !toNode) return;

    const path = createConnectionPath(fromNode, toNode, conn);
    svg.appendChild(path);
  });
}

function createConnectionPath(fromNode, toNode, conn) {
  const fromX = fromNode.x + 90; // Center of node
  const fromY = fromNode.y + 120; // Bottom of node
  const toX = toNode.x + 90;
  const toY = toNode.y; // Top of node

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  // Bezier curve
  const midY = (fromY + toY) / 2;
  const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;
  path.setAttribute('d', d);

  if (selectedConnection?.from === conn.from && selectedConnection?.to === conn.to) {
    path.classList.add('selected');
  }

  path.addEventListener('click', () => selectConnection(conn));

  return path;
}

// Dragging
function startDragging(node, e) {
  isDragging = true;
  selectedNode = node;
  dragOffset = {
    x: e.clientX - node.x,
    y: e.clientY - node.y
  };

  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDragging);
}

function handleDrag(e) {
  if (!isDragging || !selectedNode) return;

  const canvas = document.getElementById('canvasContainer');
  const rect = canvas.getBoundingClientRect();

  const x = Math.max(0, (e.clientX - rect.left) / zoom - dragOffset.x + pan.x);
  const y = Math.max(0, (e.clientY - rect.top) / zoom - dragOffset.y + pan.y);

  // Snap to grid
  selectedNode.x = Math.round(x / 20) * 20;
  selectedNode.y = Math.round(y / 20) * 20;

  // Update node position
  const nodeEl = document.querySelector(`[data-node-id="${selectedNode.id}"]`);
  if (nodeEl) {
    nodeEl.style.left = selectedNode.x + 'px';
    nodeEl.style.top = selectedNode.y + 'px';
  }

  renderConnections();
  markUnsaved();
}

function stopDragging() {
  isDragging = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDragging);
}

// Connecting
function startConnecting(node, e) {
  isConnecting = true;
  connectingFrom = node;

  const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
  if (nodeEl) nodeEl.classList.add('connecting');

  document.addEventListener('mousemove', handleConnecting);
  document.addEventListener('mouseup', cancelConnecting);
}

function handleConnecting(e) {
  // Could draw a temporary line here
}

function finishConnecting(toNode) {
  if (!connectingFrom || connectingFrom.id === toNode.id) {
    cancelConnecting();
    return;
  }

  // Check if connection already exists
  const exists = connections.some(c =>
    c.from === connectingFrom.id && c.to === toNode.id
  );

  if (!exists) {
    connections.push({
      from: connectingFrom.id,
      to: toNode.id
    });
    renderConnections();
    markUnsaved();
  }

  cancelConnecting();
}

function cancelConnecting() {
  if (connectingFrom) {
    const nodeEl = document.querySelector(`[data-node-id="${connectingFrom.id}"]`);
    if (nodeEl) nodeEl.classList.remove('connecting');
  }

  isConnecting = false;
  connectingFrom = null;
  document.removeEventListener('mousemove', handleConnecting);
  document.removeEventListener('mouseup', cancelConnecting);
}

// Selection
function selectNode(node) {
  selectedNode = node;
  selectedConnection = null;

  // Update visual selection
  document.querySelectorAll('.sequence-node').forEach(el => {
    el.classList.toggle('selected', el.dataset.nodeId === node.id);
  });

  // Update properties panel
  showNodeProperties(node);
}

function selectConnection(conn) {
  selectedConnection = conn;
  selectedNode = null;

  document.querySelectorAll('.sequence-node').forEach(el => el.classList.remove('selected'));
  renderConnections();

  document.getElementById('propertiesContent').innerHTML = `
    <div class="property-group">
      <p>Connection from <strong>${conn.from}</strong> to <strong>${conn.to}</strong></p>
    </div>
    <button class="btn btn-danger" onclick="deleteSelectedConnection()">Delete Connection</button>
  `;
}

function deleteSelectedConnection() {
  if (!selectedConnection) return;

  connections = connections.filter(c =>
    !(c.from === selectedConnection.from && c.to === selectedConnection.to)
  );
  selectedConnection = null;
  renderConnections();
  markUnsaved();

  document.getElementById('propertiesContent').innerHTML =
    '<p class="empty">Select a node to edit its properties</p>';
}

// Show node properties
function showNodeProperties(node) {
  const content = document.getElementById('propertiesContent');

  switch (node.type) {
    case 'email':
      content.innerHTML = `
        <div class="property-group">
          <label>Subject Line</label>
          <input type="text" id="propSubject" value="${escapeHtml(node.data?.subject || '')}"
                 onchange="updateNodeProperty('${node.id}', 'subject', this.value)">
        </div>
        <div class="property-group">
          <label>Email Template</label>
          <textarea id="propTemplate" rows="6"
                    onchange="updateNodeProperty('${node.id}', 'template', this.value)">${escapeHtml(node.data?.template || '')}</textarea>
        </div>
        <div class="property-group">
          <label>Send Condition</label>
          <select id="propCondition"
                  onchange="updateNodeProperty('${node.id}', 'condition', this.value)">
            <option value="always" ${node.data?.condition === 'always' ? 'selected' : ''}>Always send</option>
            <option value="not_opened" ${node.data?.condition === 'not_opened' ? 'selected' : ''}>If previous not opened</option>
            <option value="not_clicked" ${node.data?.condition === 'not_clicked' ? 'selected' : ''}>If previous not clicked</option>
            <option value="opened" ${node.data?.condition === 'opened' ? 'selected' : ''}>If previous was opened</option>
            <option value="clicked" ${node.data?.condition === 'clicked' ? 'selected' : ''}>If previous was clicked</option>
          </select>
        </div>
      `;
      break;

    case 'delay':
      content.innerHTML = `
        <div class="property-group">
          <label>Wait Duration (days)</label>
          <input type="number" id="propDays" min="0" max="90" value="${node.data?.days || 0}"
                 onchange="updateNodeProperty('${node.id}', 'days', parseInt(this.value))">
        </div>
      `;
      break;

    case 'condition':
      content.innerHTML = `
        <div class="property-group">
          <label>Condition Type</label>
          <select id="propConditionType"
                  onchange="updateNodeProperty('${node.id}', 'condition', this.value)">
            <option value="opened" ${node.data?.condition === 'opened' ? 'selected' : ''}>Email opened</option>
            <option value="clicked" ${node.data?.condition === 'clicked' ? 'selected' : ''}>Link clicked</option>
            <option value="replied" ${node.data?.condition === 'replied' ? 'selected' : ''}>Replied</option>
          </select>
        </div>
      `;
      break;

    case 'end':
      content.innerHTML = `
        <div class="property-group">
          <p>End node marks the completion of a sequence path.</p>
        </div>
      `;
      break;

    default:
      content.innerHTML = '<p class="empty">No properties available</p>';
  }
}

function updateNodeProperty(nodeId, property, value) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  if (!node.data) node.data = {};
  node.data[property] = value;

  renderCanvas();
  markUnsaved();
}

// Node operations
function editNode(nodeId) {
  const node = nodes.find(n => n.id === nodeId);
  if (!node) return;

  selectNode(node);
  showModal('nodeEditModal');
  document.getElementById('nodeEditTitle').textContent = `Edit ${node.type} Node`;

  const content = document.getElementById('nodeEditContent');

  if (node.type === 'email') {
    content.innerHTML = `
      <div class="form-group">
        <label for="editSubject">Subject Line</label>
        <input type="text" id="editSubject" value="${escapeHtml(node.data?.subject || '')}">
      </div>
      <div class="form-group">
        <label for="editTemplate">Email Body</label>
        <textarea id="editTemplate" rows="10">${escapeHtml(node.data?.template || '')}</textarea>
        <small>Use {{business_name}}, {{email}}, etc. for personalization</small>
      </div>
      <div class="form-group">
        <label for="editCondition">Send Condition</label>
        <select id="editCondition">
          <option value="always" ${node.data?.condition === 'always' ? 'selected' : ''}>Always send</option>
          <option value="not_opened" ${node.data?.condition === 'not_opened' ? 'selected' : ''}>If previous not opened</option>
          <option value="not_clicked" ${node.data?.condition === 'not_clicked' ? 'selected' : ''}>If previous not clicked</option>
          <option value="opened" ${node.data?.condition === 'opened' ? 'selected' : ''}>If previous was opened</option>
          <option value="clicked" ${node.data?.condition === 'clicked' ? 'selected' : ''}>If previous was clicked</option>
        </select>
      </div>
    `;
  } else if (node.type === 'delay') {
    content.innerHTML = `
      <div class="form-group">
        <label for="editDays">Wait Duration</label>
        <div style="display: flex; align-items: center; gap: 8px;">
          <input type="number" id="editDays" min="0" max="90" value="${node.data?.days || 0}" style="width: 100px;">
          <span>days</span>
        </div>
      </div>
    `;
  } else if (node.type === 'condition') {
    content.innerHTML = `
      <div class="form-group">
        <label for="editConditionType">Check Condition</label>
        <select id="editConditionType">
          <option value="opened" ${node.data?.condition === 'opened' ? 'selected' : ''}>Previous email opened</option>
          <option value="clicked" ${node.data?.condition === 'clicked' ? 'selected' : ''}>Link clicked in previous</option>
          <option value="replied" ${node.data?.condition === 'replied' ? 'selected' : ''}>Received a reply</option>
        </select>
      </div>
    `;
  } else {
    content.innerHTML = '<p>No editable properties for this node type.</p>';
  }
}

function saveNodeChanges() {
  if (!selectedNode) return;

  const node = selectedNode;

  if (node.type === 'email') {
    node.data = {
      ...node.data,
      subject: document.getElementById('editSubject').value,
      template: document.getElementById('editTemplate').value,
      condition: document.getElementById('editCondition').value
    };
  } else if (node.type === 'delay') {
    node.data = {
      ...node.data,
      days: parseInt(document.getElementById('editDays').value) || 0
    };
  } else if (node.type === 'condition') {
    node.data = {
      ...node.data,
      condition: document.getElementById('editConditionType').value
    };
  }

  hideModal('nodeEditModal');
  renderCanvas();
  markUnsaved();
}

function deleteNode(nodeId) {
  // Remove node
  nodes = nodes.filter(n => n.id !== nodeId);

  // Remove connections to/from this node
  connections = connections.filter(c => c.from !== nodeId && c.to !== nodeId);

  if (selectedNode?.id === nodeId) {
    selectedNode = null;
    document.getElementById('propertiesContent').innerHTML =
      '<p class="empty">Select a node to edit its properties</p>';
  }

  renderCanvas();
  markUnsaved();
}

// Drag and drop setup
function setupDragAndDrop() {
  const paletteNodes = document.querySelectorAll('.palette-node');
  const canvas = document.getElementById('canvasContainer');

  paletteNodes.forEach(node => {
    node.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('nodeType', node.dataset.type);
    });
  });

  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const nodeType = e.dataTransfer.getData('nodeType');
    if (!nodeType) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom / 20) * 20;
    const y = Math.round((e.clientY - rect.top) / zoom / 20) * 20;

    addNode(nodeType, x, y);
  });
}

function addNode(type, x, y) {
  const node = {
    id: `${type}-${nodeIdCounter++}`,
    type,
    x,
    y,
    data: getDefaultNodeData(type)
  };

  nodes.push(node);
  renderCanvas();
  selectNode(node);
  markUnsaved();
}

function getDefaultNodeData(type) {
  switch (type) {
    case 'email':
      return { subject: '', template: '', condition: 'always' };
    case 'delay':
      return { days: 1 };
    case 'condition':
      return { condition: 'opened' };
    default:
      return {};
  }
}

// Canvas interactions
function setupCanvasInteractions() {
  const container = document.getElementById('canvasContainer');

  // Click on empty area to deselect
  container.addEventListener('click', (e) => {
    if (e.target === container || e.target.classList.contains('canvas') ||
        e.target.classList.contains('canvas-grid')) {
      selectedNode = null;
      selectedConnection = null;
      document.querySelectorAll('.sequence-node').forEach(el => el.classList.remove('selected'));
      document.getElementById('propertiesContent').innerHTML =
        '<p class="empty">Select a node to edit its properties</p>';
      renderConnections();
    }
  });
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Delete selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedNode) {
        deleteNode(selectedNode.id);
      } else if (selectedConnection) {
        deleteSelectedConnection();
      }
    }

    // Save
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveSequence();
    }

    // Escape to deselect
    if (e.key === 'Escape') {
      selectedNode = null;
      selectedConnection = null;
      document.querySelectorAll('.sequence-node').forEach(el => el.classList.remove('selected'));
      renderConnections();
    }
  });
}

// Zoom controls
function zoomIn() {
  zoom = Math.min(2, zoom + 0.1);
  applyZoom();
}

function zoomOut() {
  zoom = Math.max(0.5, zoom - 0.1);
  applyZoom();
}

function resetZoom() {
  zoom = 1;
  applyZoom();
}

function applyZoom() {
  const canvas = document.getElementById('canvas');
  canvas.style.transform = `scale(${zoom})`;
  document.getElementById('zoomLevel').textContent = Math.round(zoom * 100) + '%';
}

// Sequence operations
function createNewSequence() {
  if (hasUnsavedChanges) {
    confirmAction('You have unsaved changes. Discard them?').then(confirmed => {
      if (confirmed) showModal('newSequenceModal');
    });
  } else {
    showModal('newSequenceModal');
  }
}

async function submitNewSequence(e) {
  e.preventDefault();

  const name = document.getElementById('newSequenceName').value;
  const description = document.getElementById('newSequenceDescription').value;
  const template = document.querySelector('input[name="template"]:checked').value;

  // Get initial layout based on template
  const layout = getTemplateLayout(template);

  try {
    const sequence = await api('/api/campaigns/sequences/create-visual', {
      method: 'POST',
      body: JSON.stringify({ name, description, layout })
    });

    hideModal('newSequenceModal');
    await loadSequencesList();

    currentSequenceId = sequence.id;
    document.getElementById('sequenceSelect').value = sequence.id;
    document.getElementById('sequenceName').textContent = name;
    nodes = layout.nodes;
    connections = layout.connections;
    nodeIdCounter = nodes.length + 1;

    renderCanvas();
    hasUnsavedChanges = false;

    window.history.replaceState({}, '', `?id=${sequence.id}`);
    showToast('Sequence created successfully');
  } catch (error) {
    showToast(`Failed to create sequence: ${error.message}`, 'error');
  }
}

function getTemplateLayout(template) {
  switch (template) {
    case 'simple':
      return {
        nodes: [
          { id: 'email-0', type: 'email', x: 400, y: 100, data: { subject: 'Introduction', template: '', condition: 'always' } },
          { id: 'delay-1', type: 'delay', x: 400, y: 250, data: { days: 3 } },
          { id: 'email-2', type: 'email', x: 400, y: 400, data: { subject: 'Follow-up', template: '', condition: 'not_opened' } },
          { id: 'delay-3', type: 'delay', x: 400, y: 550, data: { days: 5 } },
          { id: 'email-4', type: 'email', x: 400, y: 700, data: { subject: 'Final Check-in', template: '', condition: 'always' } },
          { id: 'end-5', type: 'end', x: 400, y: 850 }
        ],
        connections: [
          { from: 'email-0', to: 'delay-1' },
          { from: 'delay-1', to: 'email-2' },
          { from: 'email-2', to: 'delay-3' },
          { from: 'delay-3', to: 'email-4' },
          { from: 'email-4', to: 'end-5' }
        ]
      };

    case 'nurture':
      return {
        nodes: [
          { id: 'email-0', type: 'email', x: 400, y: 100, data: { subject: 'Welcome', template: '', condition: 'always' } },
          { id: 'delay-1', type: 'delay', x: 400, y: 220, data: { days: 2 } },
          { id: 'email-2', type: 'email', x: 400, y: 340, data: { subject: 'Value Proposition', template: '', condition: 'always' } },
          { id: 'delay-3', type: 'delay', x: 400, y: 460, data: { days: 3 } },
          { id: 'email-4', type: 'email', x: 400, y: 580, data: { subject: 'Case Study', template: '', condition: 'not_clicked' } },
          { id: 'delay-5', type: 'delay', x: 400, y: 700, data: { days: 4 } },
          { id: 'email-6', type: 'email', x: 400, y: 820, data: { subject: 'Offer', template: '', condition: 'always' } },
          { id: 'delay-7', type: 'delay', x: 400, y: 940, data: { days: 7 } },
          { id: 'email-8', type: 'email', x: 400, y: 1060, data: { subject: 'Last Chance', template: '', condition: 'not_replied' } },
          { id: 'end-9', type: 'end', x: 400, y: 1180 }
        ],
        connections: [
          { from: 'email-0', to: 'delay-1' },
          { from: 'delay-1', to: 'email-2' },
          { from: 'email-2', to: 'delay-3' },
          { from: 'delay-3', to: 'email-4' },
          { from: 'email-4', to: 'delay-5' },
          { from: 'delay-5', to: 'email-6' },
          { from: 'email-6', to: 'delay-7' },
          { from: 'delay-7', to: 'email-8' },
          { from: 'email-8', to: 'end-9' }
        ]
      };

    default: // blank
      return { nodes: [], connections: [] };
  }
}

function renameSequence() {
  const currentName = document.getElementById('sequenceName').textContent;
  const newName = prompt('Enter new sequence name:', currentName);
  if (newName && newName !== currentName) {
    document.getElementById('sequenceName').textContent = newName;
    markUnsaved();
  }
}

async function saveSequence() {
  if (!currentSequenceId) {
    showToast('Please create a sequence first', 'error');
    return;
  }

  try {
    await api(`/api/campaigns/sequences/${currentSequenceId}/visual`, {
      method: 'PUT',
      body: JSON.stringify({ nodes, connections })
    });

    hasUnsavedChanges = false;
    showToast('Sequence saved successfully');
  } catch (error) {
    showToast(`Failed to save: ${error.message}`, 'error');
  }
}

async function validateSequence() {
  if (!currentSequenceId) return;

  try {
    const result = await api(`/api/campaigns/sequences/${currentSequenceId}/validate`, {
      method: 'POST'
    });

    const statusEl = document.getElementById('validationStatus');
    const messagesEl = document.getElementById('validationMessages');

    if (result.valid && result.warnings.length === 0) {
      statusEl.className = 'validation-status valid';
      statusEl.innerHTML = '<span class="status-icon">✓</span><span class="status-text">Sequence is valid</span>';
      messagesEl.innerHTML = '';
    } else if (result.valid) {
      statusEl.className = 'validation-status warning';
      statusEl.innerHTML = '<span class="status-icon">!</span><span class="status-text">Valid with warnings</span>';
      messagesEl.innerHTML = result.warnings.map(w =>
        `<span class="validation-message warning">${escapeHtml(w)}</span>`
      ).join('');
    } else {
      statusEl.className = 'validation-status invalid';
      statusEl.innerHTML = '<span class="status-icon">✗</span><span class="status-text">Validation errors</span>';
      messagesEl.innerHTML = result.errors.map(e =>
        `<span class="validation-message error">${escapeHtml(e)}</span>`
      ).join('');
    }
  } catch (error) {
    console.error('Validation failed:', error);
  }
}

async function previewSequence() {
  if (!currentSequenceId) {
    showToast('Please select or create a sequence first', 'error');
    return;
  }

  showModal('previewModal');

  // Load leads for selection
  try {
    const leadsData = await api('/api/leads?limit=20');
    const select = document.getElementById('previewLeadSelect');
    select.innerHTML = '<option value="">-- Sample Data --</option>';
    leadsData.leads.forEach(lead => {
      const option = document.createElement('option');
      option.value = lead.id;
      option.textContent = lead.business_name || lead.email;
      select.appendChild(option);
    });
  } catch (error) {
    console.error('Failed to load leads:', error);
  }

  runSimulation();
}

async function runSimulation() {
  const leadId = document.getElementById('previewLeadSelect').value;
  const resultsEl = document.getElementById('simulationResults');

  try {
    const result = await api(`/api/campaigns/sequences/${currentSequenceId}/simulate`, {
      method: 'POST',
      body: JSON.stringify({
        lead_id: leadId || undefined,
        sample_data: leadId ? undefined : {
          business_name: 'Sample Business',
          email: 'sample@example.com',
          industry: 'Sample Industry'
        }
      })
    });

    if (result.steps.length === 0) {
      resultsEl.innerHTML = '<p class="empty">No steps in sequence</p>';
      return;
    }

    resultsEl.innerHTML = `
      <div style="margin-bottom: 16px;">
        <strong>Summary:</strong> ${result.emailCount} emails over ${result.totalDays} days
      </div>
      ${result.steps.map(step => `
        <div class="simulation-step ${step.type === 'skipped' ? 'skipped' : ''}">
          <div class="step-day">Day ${step.scheduledDay}</div>
          <div class="step-content">
            <div class="step-title">${escapeHtml(step.description)}</div>
            ${step.data?.conditionMet === false ?
              '<div class="step-meta">Condition not met - will be skipped</div>' : ''}
          </div>
        </div>
      `).join('')}
    `;
  } catch (error) {
    resultsEl.innerHTML = `<p class="error">Simulation failed: ${escapeHtml(error.message)}</p>`;
  }
}

function insertTemplate(templateName) {
  if (!selectedNode || selectedNode.type !== 'email') {
    showToast('Select an email node first', 'error');
    return;
  }

  // In a real implementation, this would load the template content
  selectedNode.data.template = `<!-- Template: ${templateName} -->\n\nHi {{business_name}},\n\n[Template content here]\n\nBest regards`;
  renderCanvas();
  showNodeProperties(selectedNode);
  markUnsaved();
}

function markUnsaved() {
  hasUnsavedChanges = true;
}

// Warn before leaving with unsaved changes
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();
    e.returnValue = '';
  }
});
