const API_URL = '{{MY_SECRET_API_URL}}';

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const board = document.getElementById('board');

document.addEventListener('DOMContentLoaded', () => {
    fetchSabhaData();
});

function fetchSabhaData() {
    // Show loading state (Optional)
    board.innerHTML = '<p class="col-span-full text-center text-slate-500">Loading data...</p>';

    fetch(API_URL)
        .then(response => response.json())
        .then(data => {
            // FILTER: Remove empty ghost rows
            const cleanData = data.filter(item => item.mandal && item.mandal.trim() !== "");
            buildBoard(cleanData);
        })
        .catch(error => {
            console.error("Error fetching data:", error);
            board.innerHTML = '<p class="col-span-full text-center text-red-500">Error loading data. Check console.</p>';
        });
}

function buildBoard(data) {
    board.innerHTML = ''; // Clear loading text

    days.forEach((dayName, index) => {
        // Filter data for the current day column
        const dayData = data.filter(d => d.day === dayName);
        
        // Start building the column HTML
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

        // Generate individual Sabha cards
        if (dayData.length === 0) {
            colHTML += `<div class="text-center text-slate-400 text-sm mt-4 italic">No Sabhas</div>`;
        } else {
            dayData.forEach(item => {
                // Zone Colors
                let borderColor = "border-blue-500";
                if(item.zone === "રાજકોટ 2") borderColor = "border-amber-500";
                if(item.zone === "રાજકોટ 3") borderColor = "border-emerald-500";

                // Badges
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
            
            // Close all cards first
            contents.forEach(content => content.classList.add('hidden'));
            icons.forEach(icon => icon.classList.remove('rotate-180'));
            headers.forEach(h => h.classList.remove('rounded-b-none'));

            // Open clicked card if it was previously hidden
            if (isCurrentlyHidden) {
                contents[i].classList.remove('hidden');
                icons[i].classList.add('rotate-180');
                header.classList.add('rounded-b-none');
            }
        });
    });

    // Open Monday (index 0) by default
    if (contents.length > 0) {
        contents[0].classList.remove('hidden');
        icons[0].classList.add('rotate-180');
        headers[0].classList.add('rounded-b-none');
    }
}