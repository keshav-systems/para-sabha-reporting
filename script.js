// The GitHub Action will replace this placeholder at build time
const API_URL = 'https://script.google.com/macros/s/AKfycbyqqWJjsfE-FPciB5LpHUyLODi6fPapqOhTY1kroPp4u6sCZHeDevMUP3bDiQ-S1D1e/exec';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const board = document.getElementById('board');

let allSabhaData = []; 
let currentMonday = getSafeMonday(new Date()); // Starts on the current week's Monday

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchSabhaData();
});

// --- DATE LOGIC ---

// Forces any date to snap to the closest previous Monday
function getSafeMonday(dateIn) {
    const d = new Date(dateIn);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
}

// Converts Google Sheet "DD/MM/YYYY" string into a valid Date object
function parseSheetDate(dateStr) {
    if (!dateStr) return new Date(""); 
    const parts = dateStr.split("/");
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]); // Year, Month (0-indexed), Day
    }
    return new Date(dateStr);
}

// Formats date for the UI label (e.g., "09 Feb 2026")
function formatDisplayDate(date) {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Formats date for the HTML input field (YYYY-MM-DD)
function formatInputDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// --- EVENT LISTENERS ---

function setupEventListeners() {
    document.getElementById('prevWeekBtn').addEventListener('click', () => {
        currentMonday.setDate(currentMonday.getDate() - 7);
        updateUI();
    });

    document.getElementById('nextWeekBtn').addEventListener('click', () => {
        currentMonday.setDate(currentMonday.getDate() + 7);
        updateUI();
    });

    document.getElementById('weekPicker').addEventListener('change', (e) => {
        if(e.target.value) {
            currentMonday = getSafeMonday(new Date(e.target.value));
            updateUI();
        }
    });
}

// --- DATA FETCHING & UI UPDATES ---

function fetchSabhaData() {
    board.innerHTML = '<p class="col-span-full text-center text-slate-500 mt-10">Fetching live data from Google Sheets...</p>';

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            // Remove empty ghost rows
            allSabhaData = data.filter(item => item.mandal && item.mandal.trim() !== "");
            
            // Optional: If you want it to jump straight to the date in your test data (August 2026), uncomment this line:
            // currentMonday = getSafeMonday(new Date("2026-08-07")); 
            
            updateUI();
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            board.innerHTML = '<p class="col-span-full text-center text-red-500 mt-10">Error loading data. Ensure your API URL is correct and public.</p>';
        });
}

function updateUI() {
    // 1. Calculate Saturday of the current week
    const saturday = new Date(currentMonday);
    saturday.setDate(saturday.getDate() + 5);

    // 2. Update the Text Label and Date Picker
    document.getElementById('weekRangeLabel').textContent = `${formatDisplayDate(currentMonday)} - ${formatDisplayDate(saturday)}`;
    document.getElementById('weekPicker').value = formatInputDate(currentMonday);

    // 3. Filter the data to only include dates between this Monday and Saturday
    const startTimestamp = currentMonday.getTime();
    const endTimestamp = saturday.getTime();

    const currentWeekData = allSabhaData.filter(item => {
        const itemDate = parseSheetDate(item.date);
        const itemTime = itemDate.getTime();
        return itemTime >= startTimestamp && itemTime <= endTimestamp;
    });

    // 4. Build the cards with the filtered data
    buildBoard(currentWeekData);
}

// --- RENDER LOGIC ---

function buildBoard(data) {
    board.innerHTML = ''; 

    days.forEach((dayName, index) => {
        const dayData = data.filter(d => d.day === dayName);
        
        let colHTML = `
            <div class="flex flex-col bg-slate-50 border border-slate-200 rounded-xl shadow-sm transition-all duration-300">
                <div class="day-header px-4 py-3 bg-white rounded-xl flex justify-between items-center cursor-pointer select-none" data-index="${index}">
                    <h2 class="font-bold text-slate-700">${dayName}</h2>
                    <div class="flex items-center gap-2">
                        <span class="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full font-semibold">${dayData.length}</span>
                        <svg class="toggle-icon w-4 h-4 transform transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>
                <div class="day-content p-3 space-y-3 hidden h-[50vh] overflow-y-auto scrollbar-hide border-t border-slate-200">
        `;

        if (dayData.length === 0) {
            colHTML += `<div class="text-center text-slate-400 text-sm mt-4 italic">No Sabhas</div>`;
        } else {
            dayData.forEach(item => {
                let borderColor = "border-blue-500";
                if(item.zone === "રાજકોટ 2") borderColor = "border-amber-500";
                if(item.zone === "રાજકોટ 3") borderColor = "border-emerald-500";

                let saintBadge = item.saints === "હા" ? `<span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px] font-bold">✨ સંતો</span>` : '';
                let yuvakBadge = item.isYuvak ? `<span class="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">👦 યુવક મંડળ</span>` : '';

                colHTML += `
                    <div class="bg-white border border-slate-200 border-l-4 ${borderColor} rounded-lg p-3 shadow-sm">
                        <div class="flex justify-between items-start mb-1">
                            <h3 class="font-bold text-slate-800 text-sm">${item.mandal}</h3>
                            ${yuvakBadge}
                        </div>
                        <p class="text-xs text-slate-500">${item.zone}</p>
                        <div class="mt-3 pt-2 border-t border-slate-50 flex justify-between items-center">
                            <span class="text-sm font-semibold text-slate-700">👥 ${item.attendance}</span>
                            ${saintBadge}
                        </div>
                    </div>`;
            });
        }

        colHTML += `</div></div>`;
        board.innerHTML += colHTML;
    });

    attachAccordionLogic();
}

function attachAccordionLogic() {
    const headers = document.querySelectorAll('.day-header');
    const contents = document.querySelectorAll('.day-content');
    const icons = document.querySelectorAll('.toggle-icon');

    headers.forEach((header, i) => {
        header.addEventListener('click', () => {
            const isCurrentlyHidden = contents[i].classList.contains('hidden');
            
            contents.forEach(content => content.classList.add('hidden'));
            icons.forEach(icon => icon.classList.remove('rotate-180'));
            headers.forEach(h => h.classList.remove('rounded-b-none'));

            if (isCurrentlyHidden) {
                contents[i].classList.remove('hidden');
                icons[i].classList.add('rotate-180');
                header.classList.add('rounded-b-none');
            }
        });
    });

    if (contents.length > 0) {
        contents[0].classList.remove('hidden');
        icons[0].classList.add('rotate-180');
        headers[0].classList.add('rounded-b-none');
    }
}