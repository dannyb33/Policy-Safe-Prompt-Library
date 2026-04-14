// Store prohibited patterns (PER ADMIN)
//const adminProhibitedPatterns: Record<string, RegExp[]> = {};

// Store simple words (for backward compatibility)
const adminProhibitedWords: Record<string, string[]> = {};

function stringToRegex(pattern: string): RegExp {
    return new RegExp(pattern, 'i'); // 'i' --> case insensitive
}

export function checkProhibitedPatterns(text: string, adminId: string): string[] {
    const foundPatterns: string[] = [];
    const patterns = adminProhibitedWords[adminId] || [];
    
    for (const patternStr of patterns) {
        const regex = new RegExp(patternStr, 'i'); // Reconstruct regex
        if (regex.test(text)) {
            foundPatterns.push(patternStr);
        }
    }
    return foundPatterns;
}

// 1) ADD WORD 
export function addProhibitedWord(adminId: string, word: string): void {
    //initializing list if admin does not have one yet
    if (!adminProhibitedWords[adminId]) {
        //adminProhibitedPatterns[adminId] = [];
        adminProhibitedWords[adminId] = [];
    }
    
    const regex = stringToRegex(word);
    const wordsList = adminProhibitedWords[adminId];


    // Check if word already exists
    for (let i = 0; i < wordsList.length; i++) {
        if (wordsList[i] === word.toString()) {
            throw new Error(`Word "${word}" already exists in prohibited list for admin ${adminId}`);
        }
    }
    
    // Store the word
    adminProhibitedWords[adminId].push(regex.toString());
    //console.log(`> [OK] Added pattern "${word}" for admin ${adminId}`);

}


// DELETE WORD/PATTERN
export function deleteProhibitedWord(adminId: string, delete_word: string): void {
    // Check if this admin has any prohibited words
    if (!adminProhibitedWords[adminId]) {
        throw new Error(`No prohibited words found for admin: ${adminId}`);
    }
    
    const adminWords = adminProhibitedWords[adminId];
    let wordFound = false;
    let wordIndex = -1;
    
    // iterate throguh list to find word to delete
    for (let i = 0; i < adminWords.length; i++) {
        if (adminWords[i]!.toString() === stringToRegex(delete_word).toString()) {
            wordFound = true;
            wordIndex = i;
            break;
        }
    }
    
    // case 2: word not found
    if (!wordFound) {
        throw new Error(`Word "${delete_word}" not found in prohibited list for admin ${adminId}`);
    }
    
    //delete word (if found)
    const newWordsList: string[] = [];
    for (let i = 0; i < adminWords.length; i++) {
        if (adminWords[i] !== delete_word) {
            newWordsList.push(adminWords[i]!);
        }
    }
    adminProhibitedWords[adminId] = newWordsList;
    console.log(`> [OK] Deleted word "${delete_word}" for admin ${adminId}`);
}

// GET WORD/PATTERN
export function getProhibitedPatterns(adminId: string): string[] {
    if (!adminProhibitedWords[adminId]) {
        return []; //returns empty array if admin has no prohibited patterns
    }
    
    const patternStrings: string[] = [];
    const words = adminProhibitedWords[adminId];

    for (let i = 0; i < words.length; i++) {
        // Convert regex to string and remove the /i wrapper
        const regexString = words[i]!.toString().replace(/\/i$/, '').replace(/^\//, '');
        //let pattern = regexString.substring(1, regexString.lastIndexOf('/'));

        patternStrings.push(regexString); //push(pattern)
    }
    
    return patternStrings;
}

// PRINT PROHIBITED PATTERNS
export function printProhibitedPatterns(adminId: string): void {
    const patterns = getProhibitedPatterns(adminId);
    //const words = adminProhibitedWords[adminId] || [];
    
    console.log(`\n> Prohibited patterns for admin "${adminId}":`);
    if (patterns.length === 0) {
        console.log(">   (no patterns in list)");
    } else {
        for (let i = 0; i < patterns.length; i++) {
            console.log(`>   ${i + 1}. /${patterns[i]}/i`);
            //if (words[i]) {
            //    console.log(`>      (original word: "${words[i]}")`);
            //}

        }
        console.log(`> `);
        console.log(`>   Pattern examples:`);
        console.log(`>   • "^bad"     - starts with "bad"`);
        console.log(`>   • "bad$"     - ends with "bad"`);
        console.log(`>   • "badword"  - contains "badword" anywhere`);
        console.log(`>   • "bad|evil" - contains "bad" OR "evil"`);

    }
    console.log("");
}



