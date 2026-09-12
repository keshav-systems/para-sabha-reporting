// GitHub Action replaces this placeholder at build time
const API_URL = '{{MY_SECRET_API_URL}}';

// UI Elements
const board = document.getElementById('board');
const weekRangeLabel = document.getElementById('weekRangeLabel');
const prevWeekBtn = document.getElementById('prevWeekBtn');
const nextWeekBtn = document.getElementById('nextWeekBtn');
const todayBtn = document.getElementById('todayBtn');

// State: 0 = current week, -1 = last week, +1 = next week
let weekOffset = 0; 
let rawData = [];

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

document.addEventListener('DOMContentLoaded', () => {
    setupButtons();
    loadData();
});

// --- DATE CALCULATION (Offset-based & Timezone Safe) ---

// Gets the actual Monday of the current real-world week
function getMondayOfCurrentWeek() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sun, 1 = Mon, etc.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
}

// Gets the Monday of whatever week the user has navigated to
function getActiveWeekMonday(offset) {
    const monday = getMondayOfCurrentWeek();
    monday.setDate(monday.getDate() + (offset * 7));
    return monday;
}

// Converts JS Date to strict "YYYY-MM-DD" format (Prevents timezone drift)
function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// Normalizes Google Sheet format "DD/MM/YYYY" to strict "YYYY-MM-DD"
function normalizeSheetDate(dateStr) {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    const parts = str.split('/');
    if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
        return `${year}-${month}-${day}`;
    }
    return str;
}

// Formats date for the top UI label
function formatDisplayDate(date) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// --- BUTTON LISTENERS ---

function setupButtons() {
    prevWeekBtn.addEventListener('click', () => {
        weekOffset--;
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        weekOffset++;
        renderWeek();
    });

    todayBtn.addEventListener('click', () => {
        weekOffset = 0;
        renderWeek();
    });
}

// --- FETCH DATA ---

function loadData() {
    board.innerHTML = '<p class="col-span-full text-center text-slate-500 py-10 font-medium">Fetching data from Google Sheets...</p>';

    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error("Failed to connect to API");
            return res.json();
        })
        .then(data => {
            // Filter out empty rows immediately
            rawData = data.filter(item => item.mandal && String(item.mandal).trim() !== "");
            renderWeek(); // Always renders current week
        })
        .catch(err => {
            console.error(err);
            weekRangeLabel.textContent = "Connection Error";
            board.innerHTML = '<p class="col-span-full text-center text-red-500 py-10">Unable to load data. Ensure Apps Script is deployed to Anyone.</p>';
        });
}

// --- RENDER CURRENT ACTIVE WEEK ---

function renderWeek() {
    const monday = getActiveWeekMonday(weekOffset);
    const saturday = new Date(monday);
    saturday.setDate(saturday.getDate() + 5);

    // Update Header Label
    weekRangeLabel.textContent = `${formatDisplayDate(monday)} - ${formatDisplayDate(saturday)}`;

    // Build the 6 days with exact dates for column headers
    const weekDays = [];
    for (let i = 0; i < 6; i++) {
        const d = new Date(monday);
        d.setDate(d.getDate() + i);
        weekDays.push({
            name: dayNames[i],
            dateKey: toDateKey(d),
            shortDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        });
    }

    board.innerHTML = '';

    weekDays.forEach((dayObj, index) => {
        // Strict match using YYYY-MM-DD
        const dayRecords = rawData.filter(item => normalizeSheetDate(item.date) === dayObj.dateKey);

        let colHTML = `
            <div class="flex flex-col bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all">
                <div class="day-header px-4 py-3 bg-white rounded-xl flex justify-between items-center cursor-pointer select-none" data-index="${index}">
                    <div>
                        <h2 class="font-bold text-slate-800 text-sm">${dayObj.name}</h2>
                        <span class="text-[11px] font-semibold text-slate-400">${dayObj.shortDate}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">${dayRecords.length}</span>
                        <svg class="toggle-icon w-4 h-4 transform transition-transform text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                <div class="day-content p-3 space-y-3 hidden h-[50vh] overflow-y-auto scrollbar-hide border-t border-slate-100">
        `;

        if (dayRecords.length === 0) {
            colHTML += `<div class="text-center text-slate-400 text-xs mt-6 italic">No Sabhas</div>`;
        } else {
            dayRecords.forEach(item => {
                let borderCol = "border-blue-500";
                if (item.zone === "રાજકોટ 2") borderCol = "border-amber-500";
                if (item.zone === "રાજકોટ 3") borderCol = "border-emerald-500";

                let saintBadge = item.saints === "હા" ? `<span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">✨ સંતો</span>` : '';
                let yuvakBadge = item.isYuvak ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">👦 યુવક</span>` : '';

                colHTML += `
                    <div class="bg-white border border-slate-200 border-l-4 ${borderCol} rounded-lg p-3 shadow-sm">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-800 text-xs">${item.mandal}</h3>
                            ${yuvakBadge}
                        </div>
                        <p class="text-[11px] text-slate-500">${item.zone}</p>
                        <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span class="text-xs font-semibold text-slate-700">👥 ${item.attendance || 0}</span>
                            ${saintBadge}
                        </div>
                    </div>`;
            });
        }

        colHTML += `</div></div>`;
        board.innerHTML += colHTML;
    });

    attachAccordionEvents();
}

// --- ACCORDION LOGIC ---

function attachAccordionEvents() {
    const headers = document.querySelectorAll('.day-header');
    const contents = document.querySelectorAll('.day-content');
    const icons = document.querySelectorAll('.toggle-icon');

    headers.forEach((header, i) => {
        header.addEventListener('click', () => {
            const isHidden = contents[i].classList.contains('hidden');

            contents.forEach(c => c.classList.add('hidden'));
            icons.forEach(ic => ic.classList.remove('rotate-180'));
            headers.forEach(h => h.classList.remove('rounded-b-none'));

            if (isHidden) {
                contents[i].classList.remove('hidden');
                icons[i].classList.add('rotate-180');
                header.classList.add('rounded-b-none');
            }
        });
    });

    // Auto-open Monday
    if (contents.length > 0) {
        contents[0].classList.remove('hidden');
        icons[0].classList.add('rotate-180');
        headers[0].classList.add('rounded-b-none');
    }
} 