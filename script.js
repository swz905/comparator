// Configuration - Uses Vite env vars in production, falls back to config.js for local dev
const PERPLEXITY_API_KEY = import.meta.env?.VITE_PERPLEXITY_API_KEY || (typeof CONFIG !== 'undefined' ? CONFIG.PERPLEXITY_API_KEY : '');
const GROQ_API_KEY = import.meta.env?.VITE_GROQ_API_KEY || (typeof CONFIG !== 'undefined' ? CONFIG.GROQ_API_KEY : '');
const GROQ_MODEL = import.meta.env?.VITE_GROQ_MODEL || (typeof CONFIG !== 'undefined' ? CONFIG.GROQ_MODEL : 'llama-3.3-70b-versatile');

const MAX_ITEMS = 5;
const MIN_ITEMS = 2;
const MAX_ADDITIONAL_SEARCHES = 2;

// DOM Elements
const itemsContainer = document.getElementById('items-container');
const addItemBtn = document.getElementById('add-item-btn');
const compareBtn = document.getElementById('compare-btn');
const exampleChips = document.querySelectorAll('.example-chip');
const loadingSection = document.getElementById('loading-section');
const loadingDetails = document.getElementById('loading-details');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const resultsSection = document.getElementById('results-section');
const resultsTableContainer = document.getElementById('results-table-container');
const sourcesListContainer = document.getElementById('sources-list');
const sourcesToggle = document.getElementById('sources-toggle');
const sourcesContent = document.getElementById('sources-content');
const newComparisonBtn = document.getElementById('new-comparison-btn');
const customParamsContainer = document.getElementById('custom-params-container');
const addParamBtn = document.getElementById('add-param-btn');
const customOnlyCheckbox = document.getElementById('custom-only-checkbox');
const tableViewBtn = document.getElementById('table-view-btn');
const chartViewBtn = document.getElementById('chart-view-btn');
const tableView = document.getElementById('table-view');
const chartView = document.getElementById('chart-view');
const imagesSection = document.getElementById('images-section');
const imagesContainer = document.getElementById('images-container');

// State
let currentItems = [];
let originalItems = [];
let allSources = [];
let additionalSearchCount = 0;
let radarChart = null;
let currentComparisonData = null;
let itemImages = {};

// Event Listeners
compareBtn.addEventListener('click', handleCompare);
retryBtn.addEventListener('click', handleRetry);
newComparisonBtn.addEventListener('click', resetForm);
addItemBtn.addEventListener('click', () => addNewItemInput());
addParamBtn.addEventListener('click', () => addNewParamInput());

// Sources toggle
sourcesToggle.addEventListener('click', () => {
    sourcesToggle.classList.toggle('active');
    sourcesContent.classList.toggle('hidden');
});

// View toggle
tableViewBtn.addEventListener('click', () => switchView('table'));
chartViewBtn.addEventListener('click', () => switchView('chart'));

// Example chips
exampleChips.forEach(chip => {
    chip.addEventListener('click', () => {
        const items = chip.dataset.example.split(',').map(i => i.trim());
        populateInputs(items);
    });
});

// Delegate remove button clicks for items
itemsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-item-btn')) {
        const wrapper = e.target.closest('.item-input-wrapper');
        if (getItemInputs().length > MIN_ITEMS) {
            wrapper.remove();
            updateAddButtonState();
        }
    }
});

// Delegate remove button clicks for params
customParamsContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-param-btn')) {
        e.target.closest('.param-input-wrapper').remove();
    }
});

// Helper functions for inputs
function getItemInputs() {
    return itemsContainer.querySelectorAll('.item-input');
}

function getParamInputs() {
    return customParamsContainer.querySelectorAll('.param-input');
}

function addNewItemInput(value = '') {
    if (getItemInputs().length >= MAX_ITEMS) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'item-input-wrapper';
    wrapper.innerHTML = `
        <input type="text" class="item-input" placeholder="Enter item to compare..." maxlength="100" value="${value}">
        <button type="button" class="remove-item-btn" title="Remove item">×</button>
    `;
    itemsContainer.appendChild(wrapper);
    wrapper.querySelector('.item-input').focus();
    updateAddButtonState();
}

function addNewParamInput(value = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'param-input-wrapper';
    wrapper.innerHTML = `
        <input type="text" class="param-input" placeholder="e.g., battery life, price, weight..." maxlength="50" value="${value}">
        <button type="button" class="remove-param-btn" title="Remove">×</button>
    `;
    customParamsContainer.appendChild(wrapper);
    wrapper.querySelector('.param-input').focus();
}

function updateAddButtonState() {
    const count = getItemInputs().length;
    addItemBtn.disabled = count >= MAX_ITEMS;
    addItemBtn.textContent = count >= MAX_ITEMS ? 'Maximum items reached' : '+ Add Item';
}

function populateInputs(items) {
    itemsContainer.innerHTML = '';
    items.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'item-input-wrapper';
        wrapper.innerHTML = `
            <input type="text" class="item-input" placeholder="Enter item to compare..." maxlength="100" value="${item}">
            <button type="button" class="remove-item-btn" title="Remove item">×</button>
        `;
        itemsContainer.appendChild(wrapper);
    });
    updateAddButtonState();
}

function getCustomParams() {
    return Array.from(getParamInputs())
        .map(input => input.value.trim())
        .filter(p => p.length > 0);
}

function switchView(view) {
    if (view === 'table') {
        tableViewBtn.classList.add('active');
        chartViewBtn.classList.remove('active');
        tableView.classList.remove('hidden');
        chartView.classList.add('hidden');
    } else {
        chartViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        chartView.classList.remove('hidden');
        tableView.classList.add('hidden');
        if (currentComparisonData) {
            renderRadarChart(currentComparisonData);
        }
    }
}

// Main comparison handler
async function handleCompare() {
    originalItems = Array.from(getItemInputs())
        .map(input => input.value.trim())
        .filter(item => item.length > 0);

    if (originalItems.length < MIN_ITEMS) {
        showError(`Please enter at least ${MIN_ITEMS} items to compare`);
        return;
    }

    if (originalItems.length > MAX_ITEMS) {
        showError(`Please limit comparison to ${MAX_ITEMS} items or fewer`);
        return;
    }

    // Reset state
    allSources = [];
    additionalSearchCount = 0;
    itemImages = {};

    hideAllSections();
    showLoading();

    try {
        // Step 1: Correct spelling of items
        updateLoadingDetails('Checking item names...');
        currentItems = await correctSpelling(originalItems);

        // Step 2: Search each item
        updateLoadingDetails('Searching for information...');
        const searchResults = await searchAllItems(currentItems);

        // Step 3: Generate comparison
        updateLoadingDetails('Analyzing and generating comparison...');
        const customParams = getCustomParams();
        const customOnly = customOnlyCheckbox.checked;
        const comparisonData = await generateComparison(currentItems, searchResults, customParams, customOnly);

        // Store for chart rendering
        currentComparisonData = comparisonData;

        // Step 4: Display results
        displayResults(comparisonData);

        // Step 5: Scroll to results
        scrollToResults();

    } catch (error) {
        console.error('Comparison error:', error);
        showError(error.message || 'An unexpected error occurred. Please try again.');
    }
}

// Spelling correction using Groq
async function correctSpelling(items) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'You correct spelling mistakes in product/item names. Return a JSON array of corrected names in the same order. Only fix obvious spelling mistakes, keep the meaning the same. If a name is already correct, return it as-is.'
                    },
                    {
                        role: 'user',
                        content: `Correct any spelling mistakes in these item names: ${JSON.stringify(items)}\n\nReturn ONLY a JSON array of corrected names, nothing else. Example: ["iPhone 15 Pro", "Samsung Galaxy S24"]`
                    }
                ],
                temperature: 0.1,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            console.error('Spelling correction failed, using original items');
            return items;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        try {
            const corrected = JSON.parse(content);
            if (Array.isArray(corrected) && corrected.length === items.length) {
                return corrected;
            }
        } catch (e) {
            console.error('Failed to parse spelling correction');
        }

        return items;
    } catch (error) {
        console.error('Spelling correction error:', error);
        return items;
    }
}

function scrollToResults() {
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// Search functions
async function searchAllItems(items) {
    const searchPromises = items.map(item => searchWithPerplexity(item));
    return await Promise.all(searchPromises);
}

async function searchWithPerplexity(item) {
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a research assistant. Provide detailed information about the item including specifications, features, pricing, pros/cons. Also provide an image URL if available - format it as [IMAGE_URL: url] at the end of your response.'
                    },
                    {
                        role: 'user',
                        content: `Provide detailed information about: ${item}. Include specifications, features, price range, pros and cons. If there's a well-known product image, include it as [IMAGE_URL: url] at the end.`
                    }
                ],
                max_tokens: 1024,
                temperature: 0.2,
                return_citations: true,
                return_related_questions: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Search failed for "${item}"`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const citations = data.citations || [];

        // Extract image URL if present
        const imageMatch = content.match(/\[IMAGE_URL:\s*(https?:\/\/[^\]]+)\]/i);
        if (imageMatch) {
            itemImages[item] = imageMatch[1];
        }

        citations.forEach((url, index) => {
            allSources.push({
                title: `Source ${index + 1} for ${item}`,
                url: url,
                item: item
            });
        });

        return {
            item: item,
            content: content.replace(/\[IMAGE_URL:[^\]]+\]/i, '').trim(),
            citations: citations,
            results: [{ snippet: content, title: item }]
        };

    } catch (error) {
        console.error(`Search error for "${item}":`, error);
        throw new Error(`Failed to search for "${item}": ${error.message}`);
    }
}

async function additionalSearch(query) {
    if (!query || additionalSearchCount >= MAX_ADDITIONAL_SEARCHES) {
        return null;
    }

    additionalSearchCount++;
    updateLoadingDetails(`Additional research: ${query.substring(0, 50)}...`);

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: 'Provide a brief, factual answer.' },
                    { role: 'user', content: query }
                ],
                max_tokens: 512,
                temperature: 0.2,
                return_citations: true
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const citations = data.citations || [];

        citations.forEach((url, index) => {
            allSources.push({
                title: `Additional source ${index + 1}`,
                url: url,
                item: 'Additional Research'
            });
        });

        return content;
    } catch (error) {
        return null;
    }
}

// Generate comparison
async function generateComparison(items, searchResults, customParams = [], customOnly = false) {
    try {
        const searchSummary = searchResults.map(result => {
            return `Item: ${result.item}\nInformation:\n${result.content}\n`;
        }).join('\n---\n');

        let customParamsInstruction = '';
        if (customParams.length > 0) {
            if (customOnly) {
                customParamsInstruction = `\n\nIMPORTANT: Use ONLY these custom parameters specified by the user (do NOT add any other metrics): ${customParams.join(', ')}`;
            } else {
                customParamsInstruction = `\n\nIMPORTANT: Make sure to include these custom parameters specified by the user IN ADDITION to other relevant metrics: ${customParams.join(', ')}`;
            }
        }

        const prompt = `You are a comparison expert. Based on the following web search results, create a comprehensive comparison of: ${items.join(', ')}.

Search Results:
${searchSummary}
${customParamsInstruction}

Respond with a JSON object:
{
    "metrics": [
        {
            "name": "Metric Name",
            "description": "Brief 1-2 sentence explanation.",
            "isObjective": true
        }
    ],
    "comparison": {
        "Item Name": {
            "Metric Name": "value WITH UNIT (e.g., $999, 6.7 inches)"
        }
    },
    "chartScores": {
        "Metric Name": {
            "Item Name": 75
        }
    },
    "winners": {
        "Metric Name": "Best item name or null if subjective"
    }
}

RULES:
1. Include ${customOnly ? 'ONLY the custom parameters' : '5-10 metrics'}
2. "comparison" contains DISPLAY values with proper units (e.g., "$999", "6.7 inches", "4500mAh")
3. "chartScores" contains NORMALIZED scores from 0-100 for radar chart visualization:
   - For each metric, score each item relative to the others (best = 90-100, worst = 20-40)
   - Higher score = better (even for price: cheaper = higher score)
   - Score based on how good the value is in real-world context
4. In "winners", mark the best item per metric (null if subjective)
5. Use exact item names: ${items.join(', ')}
6. Return ONLY valid JSON
7. ALWAYS include proper units in comparison values:
   - Price: "$999", "₹79,999" | Battery: "4500mAh" | Display: "6.7 inches"
   - Weight: "187g" | Storage: "256GB" | RAM: "8GB" | Refresh: "120Hz"`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'Generate comparison data as valid JSON only.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Comparison generation failed');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) throw new Error('No response from AI');

        let comparisonData;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            comparisonData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);
        } catch (parseError) {
            console.error('JSON parse error:', content);
            throw new Error('Failed to parse comparison data');
        }

        if (!comparisonData.metrics || !comparisonData.comparison) {
            throw new Error('Invalid comparison data structure');
        }

        if (!comparisonData.winners) comparisonData.winners = {};

        // Handle additional searches for winner determination
        if (comparisonData.needsMoreInfo?.length > 0 && additionalSearchCount < MAX_ADDITIONAL_SEARCHES) {
            for (const info of comparisonData.needsMoreInfo.slice(0, MAX_ADDITIONAL_SEARCHES)) {
                const additionalInfo = await additionalSearch(info.query);
                if (additionalInfo) {
                    const winnerResult = await determineWinner(info.metric, items, additionalInfo);
                    if (winnerResult) comparisonData.winners[info.metric] = winnerResult;
                }
            }
        }

        return comparisonData;

    } catch (error) {
        console.error('Groq API error:', error);
        throw new Error(`Comparison generation failed: ${error.message}`);
    }
}

async function determineWinner(metric, items, additionalInfo) {
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: GROQ_MODEL,
                messages: [
                    {
                        role: 'system',
                        content: 'Determine which item is better for the metric. Respond with ONLY the item name or "null".'
                    },
                    {
                        role: 'user',
                        content: `Which is better for "${metric}"?\nItems: ${items.join(', ')}\nInfo: ${additionalInfo}\nRespond with ONLY the winning item name or "null".`
                    }
                ],
                temperature: 0.1,
                max_tokens: 100
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        const winner = data.choices[0]?.message?.content?.trim();

        if (winner && winner !== 'null' && items.includes(winner)) {
            return winner;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Display functions
function displayResults(comparisonData) {
    hideAllSections();

    // Show correction notice if items were corrected
    const corrections = [];
    originalItems.forEach((orig, i) => {
        if (orig.toLowerCase() !== currentItems[i].toLowerCase()) {
            corrections.push({ from: orig, to: currentItems[i] });
        }
    });

    // Display images if available for all items
    displayImages();

    // Build table
    const table = document.createElement('table');
    table.className = 'comparison-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const metricHeader = document.createElement('th');
    metricHeader.textContent = 'Metric';
    headerRow.appendChild(metricHeader);

    currentItems.forEach(item => {
        const th = document.createElement('th');
        th.textContent = item;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');

    const metricsArray = comparisonData.metrics.map(m =>
        typeof m === 'string' ? { name: m, description: '', isObjective: true } : m
    );

    metricsArray.forEach(metric => {
        const metricName = metric.name || metric;
        const row = document.createElement('tr');

        const metricCell = document.createElement('td');
        metricCell.className = 'metric-cell';

        const metricNameSpan = document.createElement('span');
        metricNameSpan.className = 'metric-name';
        metricNameSpan.textContent = metricName;

        if (metric.description) {
            metricNameSpan.classList.add('has-tooltip');
            metricNameSpan.setAttribute('data-tooltip', metric.description);
        }

        metricCell.appendChild(metricNameSpan);
        row.appendChild(metricCell);

        const winner = comparisonData.winners?.[metricName];

        currentItems.forEach(item => {
            const valueCell = document.createElement('td');
            const value = comparisonData.comparison[item]?.[metricName] || 'N/A';

            const valueContainer = document.createElement('div');
            valueContainer.className = 'value-container';

            if (winner && winner === item) {
                valueContainer.classList.add('winner');
                const badge = document.createElement('span');
                badge.className = 'winner-badge';
                badge.textContent = '✓';
                badge.title = 'Best for this metric';
                valueContainer.appendChild(badge);
            }

            const valueText = document.createElement('span');
            valueText.className = 'value-text';
            valueText.textContent = value;
            valueContainer.appendChild(valueText);

            valueCell.appendChild(valueContainer);
            row.appendChild(valueCell);
        });

        tbody.appendChild(row);
    });

    table.appendChild(tbody);

    // Add correction notice if needed
    resultsTableContainer.innerHTML = '';

    if (corrections.length > 0) {
        const notice = document.createElement('div');
        notice.className = 'correction-notice';
        notice.innerHTML = `
            <span class="correction-notice-icon">✨</span>
            <span class="correction-notice-text">
                Auto-corrected: ${corrections.map(c => `<strong>${c.from}</strong> → <strong>${c.to}</strong>`).join(', ')}
            </span>
        `;
        resultsTableContainer.appendChild(notice);
    }

    resultsTableContainer.appendChild(table);

    displaySources();
    sourcesContent.classList.add('hidden');
    sourcesToggle.classList.remove('active');

    // Reset view to table
    switchView('table');

    resultsSection.classList.remove('hidden');
}

function displayImages() {
    // Only show images if we have them for ALL items
    const allHaveImages = currentItems.every(item => itemImages[item]);

    if (!allHaveImages || currentItems.length === 0) {
        imagesSection.classList.add('hidden');
        return;
    }

    imagesContainer.innerHTML = '';

    currentItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'image-card';

        const img = document.createElement('img');
        img.src = itemImages[item];
        img.alt = item;
        img.onerror = () => {
            // If image fails to load, hide the entire images section
            imagesSection.classList.add('hidden');
        };

        const title = document.createElement('div');
        title.className = 'image-card-title';
        title.textContent = item;

        card.appendChild(img);
        card.appendChild(title);
        imagesContainer.appendChild(card);
    });

    imagesSection.classList.remove('hidden');
}

function renderRadarChart(comparisonData) {
    const ctx = document.getElementById('radar-chart').getContext('2d');

    // Destroy existing chart
    if (radarChart) {
        radarChart.destroy();
    }

    const metricsArray = comparisonData.metrics.map(m =>
        typeof m === 'string' ? { name: m, numericValue: true } : m
    );

    // Use up to 8 metrics for the chart
    const chartMetrics = metricsArray.slice(0, 8);

    if (chartMetrics.length < 3) {
        chartView.innerHTML = '<div class="chart-container"><p style="color: var(--text-muted);">Not enough metrics for chart visualization. At least 3 needed.</p></div>';
        return;
    }

    const labels = chartMetrics.map(m => m.name);

    // Generate colors for each item
    const colors = [
        { bg: 'rgba(20, 184, 166, 0.2)', border: 'rgba(20, 184, 166, 1)' },
        { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 1)' },
        { bg: 'rgba(236, 72, 153, 0.2)', border: 'rgba(236, 72, 153, 1)' },
        { bg: 'rgba(99, 102, 241, 0.2)', border: 'rgba(99, 102, 241, 1)' },
        { bg: 'rgba(34, 197, 94, 0.2)', border: 'rgba(34, 197, 94, 1)' }
    ];

    const datasets = currentItems.map((item, index) => {
        const data = chartMetrics.map(metric => {
            // Use chartScores if available (LLM-provided normalized scores)
            if (comparisonData.chartScores?.[metric.name]?.[item] !== undefined) {
                return comparisonData.chartScores[metric.name][item];
            }
            // Fallback: try to extract number from comparison value
            const value = comparisonData.comparison[item]?.[metric.name] || 'N/A';
            const numMatch = value.toString().match(/[\d.]+/);
            if (numMatch) {
                let num = parseFloat(numMatch[0]);
                // Clamp to 0-100
                return Math.min(Math.max(num, 0), 100);
            }
            return 50; // Default for non-numeric
        });

        return {
            label: item,
            data: data,
            backgroundColor: colors[index % colors.length].bg,
            borderColor: colors[index % colors.length].border,
            borderWidth: 2,
            pointBackgroundColor: colors[index % colors.length].border,
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: colors[index % colors.length].border
        };
    });

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.5)',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    angleLines: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    pointLabels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function displaySources() {
    sourcesListContainer.innerHTML = '';

    const uniqueSources = allSources.filter((source, index, self) =>
        index === self.findIndex(s => s.url === source.url)
    );

    if (uniqueSources.length === 0) {
        sourcesListContainer.innerHTML = '<p style="color: var(--text-muted);">No sources available</p>';
        return;
    }

    uniqueSources.forEach(source => {
        const sourceItem = document.createElement('div');
        sourceItem.className = 'source-item';

        const title = document.createElement('div');
        title.className = 'source-title';
        title.textContent = source.title;

        const link = document.createElement('a');
        link.className = 'source-link';
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = source.url;

        sourceItem.appendChild(title);
        sourceItem.appendChild(link);
        sourcesListContainer.appendChild(sourceItem);
    });
}

// UI State Management
function showLoading() {
    loadingSection.classList.remove('hidden');
}

function updateLoadingDetails(text) {
    loadingDetails.textContent = text;
}

function showError(message) {
    hideAllSections();
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
}

function hideAllSections() {
    loadingSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
}

function handleRetry() {
    hideAllSections();
    handleCompare();
}

function resetForm() {
    hideAllSections();
    itemsContainer.innerHTML = `
        <div class="item-input-wrapper">
            <input type="text" class="item-input" placeholder="e.g., iPhone 15 Pro" maxlength="100">
            <button type="button" class="remove-item-btn" title="Remove item">×</button>
        </div>
        <div class="item-input-wrapper">
            <input type="text" class="item-input" placeholder="e.g., Samsung Galaxy S24" maxlength="100">
            <button type="button" class="remove-item-btn" title="Remove item">×</button>
        </div>
    `;
    customParamsContainer.innerHTML = '';
    customOnlyCheckbox.checked = false;
    currentItems = [];
    originalItems = [];
    allSources = [];
    additionalSearchCount = 0;
    currentComparisonData = null;
    itemImages = {};

    if (radarChart) {
        radarChart.destroy();
        radarChart = null;
    }

    updateAddButtonState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize
updateAddButtonState();
console.log('Universal Comparison Tool initialized with all features!');
