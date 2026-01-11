// Load papers data
let papersData = null;
let currentSort = 'year'; // 'year' or 'subject'

// Subject group mapping
const SUBJECT_GROUPS = {
    // Group 1 - Studies in Language and Literature
    'english_a_literature': 'Group 1 - Studies in Language and Literature',
    'english_a_language_and_literature': 'Group 1 - Studies in Language and Literature',
    'english_a': 'Group 1 - Studies in Language and Literature',
    'studies_in_language_and_literature': 'Group 1 - Studies in Language and Literature',
    'literature': 'Group 1 - Studies in Language and Literature',
    'language_and_literature': 'Group 1 - Studies in Language and Literature',
    
    // Group 2 - Language Acquisition
    'english_b': 'Group 2 - Language Acquisition',
    'latin': 'Group 2 - Language Acquisition',
    
    // Group 3 - Individuals and Societies
    'business_management': 'Group 3 - Individuals and Societies',
    'business_and_management': 'Group 3 - Individuals and Societies',
    'economics': 'Group 3 - Individuals and Societies',
    'geography': 'Group 3 - Individuals and Societies',
    'history': 'Group 3 - Individuals and Societies',
    'philosophy': 'Group 3 - Individuals and Societies',
    'psychology': 'Group 3 - Individuals and Societies',
    'global_politics': 'Group 3 - Individuals and Societies',
    'itgs': 'Group 3 - Individuals and Societies',
    'information_technology_in_a_global_society': 'Group 3 - Individuals and Societies',
    'social_and_cultural_anthropology': 'Group 3 - Individuals and Societies',
    'world_religions': 'Group 3 - Individuals and Societies',
    'environmental_systems_and_societies': 'Group 3 - Individuals and Societies',
    'digital_society': 'Group 3 - Individuals and Societies',
    
    // Group 4 - Experimental Sciences
    'biology': 'Group 4 - Experimental Sciences',
    'chemistry': 'Group 4 - Experimental Sciences',
    'physics': 'Group 4 - Experimental Sciences',
    'design_technology': 'Group 4 - Experimental Sciences',
    'computer_science': 'Group 4 - Experimental Sciences',
    'sports_exercise_and_health_science': 'Group 4 - Experimental Sciences',
    'ess': 'Group 4 - Experimental Sciences',
    
    // Group 5 - Mathematics
    'mathematics': 'Group 5 - Mathematics',
    'mathematics_analysis_and_approaches': 'Group 5 - Mathematics',
    'mathematics_applications_and_interpretation': 'Group 5 - Mathematics',
    'math_hl': 'Group 5 - Mathematics',
    'math_sl': 'Group 5 - Mathematics',
    'further_mathematics': 'Group 5 - Mathematics',
    'mathematical_studies': 'Group 5 - Mathematics',
    
    // Core
    'theory_of_knowledge': 'Core',
    'tok': 'Core',
};

async function loadData() {
    try {
        const response = await fetch('papers_data.json');
        papersData = await response.json();
        initializeFilters();
        renderPastPapersTree();
        renderSpecimenPapersTree();
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('past-papers-tree').innerHTML = 
            '<p class="no-results">Error loading papers data. Make sure papers_data.json is in the same directory.</p>';
    }
}

function initializeFilters() {
    // Populate year filter
    const yearFilter = document.getElementById('year-filter');
    if (papersData.years) {
        papersData.years.slice().reverse().forEach(year => {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            yearFilter.appendChild(option);
        });
    }
    
    // Populate subject filter
    const subjectFilter = document.getElementById('subject-filter');
    const subjects = new Set();
    Object.values(papersData.past_papers).forEach(yearData => {
        Object.keys(yearData).forEach(subject => subjects.add(subject));
    });
    [...subjects].sort().forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = formatSubjectName(subject);
        subjectFilter.appendChild(option);
    });
    
    // Populate specimen group filter
    const specimenGroupFilter = document.getElementById('specimen-group-filter');
    const groups = new Set(papersData.specimen_papers.map(p => p.group));
    [...groups].sort().forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        specimenGroupFilter.appendChild(option);
    });
}

function formatSubjectName(name) {
    return name.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function getSubjectGroup(subject) {
    return SUBJECT_GROUPS[subject] || 'Other';
}

function matchesFilters(paper) {
    const levelFilter = document.getElementById('level-filter').value;
    const timezoneFilter = document.getElementById('timezone-filter').value;
    const paperFilter = document.getElementById('paper-filter').value;
    const typeFilter = document.getElementById('type-filter').value;
    const search = document.getElementById('search').value.toLowerCase();
    
    if (levelFilter && paper.level !== levelFilter) return false;
    if (timezoneFilter && paper.timezone !== timezoneFilter) return false;
    if (paperFilter && paper.paper_number !== paperFilter) return false;
    
    if (typeFilter === 'paper' && (paper.is_markscheme || paper.is_resource)) return false;
    if (typeFilter === 'markscheme' && !paper.is_markscheme) return false;
    if (typeFilter === 'resource' && !paper.is_resource) return false;
    
    if (search) {
        const searchStr = `${paper.name || ''} ${paper.code || ''}`.toLowerCase();
        if (!searchStr.includes(search)) return false;
    }
    
    return true;
}

function renderPastPapersTree() {
    const container = document.getElementById('past-papers-tree');
    const yearFilter = document.getElementById('year-filter').value;
    const subjectFilter = document.getElementById('subject-filter').value;
    
    container.innerHTML = '';
    
    if (currentSort === 'year') {
        renderByYear(container, yearFilter, subjectFilter);
    } else {
        renderBySubject(container, yearFilter, subjectFilter);
    }
}

function renderByYear(container, yearFilter, subjectFilter) {
    // Build tree structure: Year > Group > Subject > Papers
    const tree = {};
    
    Object.entries(papersData.past_papers).forEach(([year, subjects]) => {
        if (yearFilter && year !== yearFilter) return;
        
        Object.entries(subjects).forEach(([subject, papers]) => {
            if (subjectFilter && subject !== subjectFilter) return;
            
            const group = getSubjectGroup(subject);
            const filteredPapers = papers.filter(matchesFilters);
            
            if (filteredPapers.length === 0) return;
            
            if (!tree[year]) tree[year] = {};
            if (!tree[year][group]) tree[year][group] = {};
            if (!tree[year][group][subject]) tree[year][group][subject] = [];
            
            tree[year][group][subject].push(...filteredPapers);
        });
    });
    
    // Render tree
    const years = Object.keys(tree).sort().reverse();
    
    if (years.length === 0) {
        container.innerHTML = '<p class="no-results">No papers found matching your criteria.</p>';
        return;
    }
    
    years.forEach(year => {
        const yearNode = createYearNode(year, tree[year]);
        container.appendChild(yearNode);
    });
}

function renderBySubject(container, yearFilter, subjectFilter) {
    // Build tree structure: Group > Subject > Year > Papers
    const tree = {};
    
    Object.entries(papersData.past_papers).forEach(([year, subjects]) => {
        if (yearFilter && year !== yearFilter) return;
        
        Object.entries(subjects).forEach(([subject, papers]) => {
            if (subjectFilter && subject !== subjectFilter) return;
            
            const group = getSubjectGroup(subject);
            const filteredPapers = papers.filter(matchesFilters);
            
            if (filteredPapers.length === 0) return;
            
            if (!tree[group]) tree[group] = {};
            if (!tree[group][subject]) tree[group][subject] = {};
            if (!tree[group][subject][year]) tree[group][subject][year] = [];
            
            tree[group][subject][year].push(...filteredPapers);
        });
    });
    
    // Render tree
    const groups = Object.keys(tree).sort();
    
    if (groups.length === 0) {
        container.innerHTML = '<p class="no-results">No papers found matching your criteria.</p>';
        return;
    }
    
    groups.forEach(group => {
        const groupNode = createGroupNodeBySubject(group, tree[group]);
        container.appendChild(groupNode);
    });
}

function createGroupNodeBySubject(group, subjects) {
    const node = document.createElement('div');
    node.className = 'tree-node group-node';
    
    const totalPapers = Object.values(subjects).reduce((sum, years) => 
        sum + Object.values(years).reduce((s, papers) => s + papers.length, 0), 0);
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📁</span>
        <span class="label">${group}</span>
        <span class="count">${totalPapers} papers</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    Object.keys(subjects).sort().forEach(subject => {
        children.appendChild(createSubjectNodeBySubject(subject, subjects[subject]));
    });
    
    folder.addEventListener('click', () => {
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createSubjectNodeBySubject(subject, years) {
    const node = document.createElement('div');
    node.className = 'tree-node subject-node';
    
    const totalPapers = Object.values(years).reduce((sum, papers) => sum + papers.length, 0);
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📚</span>
        <span class="label">${formatSubjectName(subject)}</span>
        <span class="count">${totalPapers}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    Object.keys(years).sort().reverse().forEach(year => {
        children.appendChild(createYearNodeInSubject(year, years[year]));
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createYearNodeInSubject(year, papers) {
    const node = document.createElement('div');
    node.className = 'tree-node year-node-inner';
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📅</span>
        <span class="label">${year}</span>
        <span class="count">${papers.length}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    // Sort papers: regular papers first, then mark schemes, then resources
    const sortedPapers = papers.sort((a, b) => {
        if (a.is_resource !== b.is_resource) return a.is_resource ? 1 : -1;
        if (a.is_markscheme !== b.is_markscheme) return a.is_markscheme ? 1 : -1;
        return (a.code || '').localeCompare(b.code || '');
    });
    
    sortedPapers.forEach(paper => {
        children.appendChild(createPaperNode(paper));
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createYearNode(year, groups) {
    const node = document.createElement('div');
    node.className = 'tree-node year-node';
    
    const totalPapers = Object.values(groups).reduce((sum, subjects) => 
        sum + Object.values(subjects).reduce((s, papers) => s + papers.length, 0), 0);
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📅</span>
        <span class="label">${year}</span>
        <span class="count">${totalPapers} papers</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    Object.keys(groups).sort().forEach(group => {
        children.appendChild(createGroupNode(group, groups[group]));
    });
    
    folder.addEventListener('click', () => {
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createGroupNode(group, subjects) {
    const node = document.createElement('div');
    node.className = 'tree-node group-node';
    
    const totalPapers = Object.values(subjects).reduce((sum, papers) => sum + papers.length, 0);
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📁</span>
        <span class="label">${group}</span>
        <span class="count">${totalPapers}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    Object.keys(subjects).sort().forEach(subject => {
        children.appendChild(createSubjectNode(subject, subjects[subject]));
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createSubjectNode(subject, papers) {
    const node = document.createElement('div');
    node.className = 'tree-node subject-node';
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📚</span>
        <span class="label">${formatSubjectName(subject)}</span>
        <span class="count">${papers.length}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    // Sort papers: regular papers first, then mark schemes, then resources
    const sortedPapers = papers.sort((a, b) => {
        if (a.is_resource !== b.is_resource) return a.is_resource ? 1 : -1;
        if (a.is_markscheme !== b.is_markscheme) return a.is_markscheme ? 1 : -1;
        return (a.code || '').localeCompare(b.code || '');
    });
    
    sortedPapers.forEach(paper => {
        children.appendChild(createPaperNode(paper));
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createPaperNode(paper) {
    const link = document.createElement('a');
    const fileClass = paper.is_markscheme ? 'markscheme' : paper.is_resource ? 'resource' : '';
    link.className = `tree-file ${fileClass}`;
    link.href = `past_papers/${paper.name}`;
    link.target = '_blank';
    
    const icon = paper.is_markscheme ? '📝' : paper.is_resource ? '📎' : '📄';
    const label = paper.is_markscheme ? 'Mark Scheme' : paper.is_resource ? 'Resource' : 'Paper';
    
    let tags = '';
    if (paper.level) {
        tags += `<span class="tag ${paper.level.toLowerCase()}">${paper.level}</span>`;
    }
    if (paper.timezone && paper.timezone !== 'TZ0') {
        tags += `<span class="tag ${paper.timezone.toLowerCase()}">${paper.timezone}</span>`;
    }
    if (paper.paper_number) {
        tags += `<span class="tag">P${paper.paper_number}</span>`;
    }
    if (paper.session) {
        tags += `<span class="tag">${paper.session.substring(0, 3)}</span>`;
    }
    if (paper.is_markscheme) {
        tags += `<span class="tag ms">MS</span>`;
    }
    
    link.innerHTML = `
        <span class="file-icon">${icon}</span>
        <span class="label">${label} ${paper.paper_number || ''}</span>
        <div class="tags">${tags}</div>
    `;
    
    return link;
}

function renderSpecimenPapersTree() {
    const container = document.getElementById('specimen-papers-tree');
    const groupFilter = document.getElementById('specimen-group-filter').value;
    const search = document.getElementById('specimen-search').value.toLowerCase();
    
    container.innerHTML = '';
    
    // Build tree structure: Group > Subject > Papers
    const tree = {};
    
    papersData.specimen_papers.forEach(paper => {
        if (groupFilter && paper.group !== groupFilter) return;
        if (search && !paper.name.toLowerCase().includes(search) && 
            !paper.subject.toLowerCase().includes(search)) return;
        
        if (!tree[paper.group]) tree[paper.group] = {};
        if (!tree[paper.group][paper.subject]) tree[paper.group][paper.subject] = [];
        
        tree[paper.group][paper.subject].push(paper);
    });
    
    const groups = Object.keys(tree).sort();
    
    if (groups.length === 0) {
        container.innerHTML = '<p class="no-results">No specimen papers found.</p>';
        return;
    }
    
    groups.forEach(group => {
        const groupNode = createSpecimenGroupNode(group, tree[group]);
        container.appendChild(groupNode);
    });
}

function createSpecimenGroupNode(group, subjects) {
    const node = document.createElement('div');
    node.className = 'tree-node group-node';
    
    const totalPapers = Object.values(subjects).reduce((sum, papers) => sum + papers.length, 0);
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📁</span>
        <span class="label">${group}</span>
        <span class="count">${totalPapers}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    Object.keys(subjects).sort().forEach(subject => {
        const subjectNode = createSpecimenSubjectNode(subject, subjects[subject], group);
        children.appendChild(subjectNode);
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

function createSpecimenSubjectNode(subject, papers, group) {
    const node = document.createElement('div');
    node.className = 'tree-node subject-node';
    
    const folder = document.createElement('div');
    folder.className = 'tree-folder';
    folder.innerHTML = `
        <span class="icon">▶</span>
        <span class="folder-icon">📚</span>
        <span class="label">${subject}</span>
        <span class="count">${papers.length}</span>
    `;
    
    const children = document.createElement('div');
    children.className = 'tree-children';
    
    papers.forEach(paper => {
        const link = document.createElement('a');
        link.className = 'specimen-file';
        // Fix the path encoding
        const encodedGroup = encodeURIComponent(group);
        const encodedSubject = encodeURIComponent(subject);
        const encodedName = encodeURIComponent(paper.name.replace(/ /g, '_') + '.pdf');
        link.href = `specimen_papers/${encodedGroup}/${encodedSubject}/${encodedName}`;
        link.target = '_blank';
        
        link.innerHTML = `
            <span class="file-icon">📋</span>
            <span class="label">${paper.name}</span>
        `;
        
        children.appendChild(link);
    });
    
    folder.addEventListener('click', (e) => {
        e.stopPropagation();
        folder.classList.toggle('open');
        children.classList.toggle('open');
    });
    
    node.appendChild(folder);
    node.appendChild(children);
    return node;
}

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// Filter event listeners
document.getElementById('year-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('subject-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('level-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('timezone-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('paper-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('type-filter').addEventListener('change', renderPastPapersTree);
document.getElementById('search').addEventListener('input', renderPastPapersTree);
document.getElementById('specimen-group-filter').addEventListener('change', renderSpecimenPapersTree);
document.getElementById('specimen-search').addEventListener('input', renderSpecimenPapersTree);

// Sort toggle
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSort = btn.dataset.sort;
        renderPastPapersTree();
    });
});

// Initialize
loadData();
