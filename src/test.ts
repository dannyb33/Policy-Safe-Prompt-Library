// // list of prohibited words, check if any input of the variables contains a prohibited word. if yes then print error, else continue. 

// //imports files from other files....

// //let prohibited: string[] = [];
// const adminProhibitedWords: Record<string, string[]> = {};

// export function addProhibitedWords(adminID: string, word: string): void {
    
//     //case where admin does not have words list created yet
//     if (!adminProhibitedWords[adminID]) {
//         adminProhibitedWords[adminID] = [];
//     }

//     //case 1: word already exists --> skip
//     for (let i = 0; i < adminProhibitedWords[adminID].length; i++) {
//         if (adminProhibitedWords[adminID][i] === word) {
//             throw new Error(`Word "${word}" already exists in prohibited list for admin ${adminID}`);
//         }
//     }
    
//     //case2: word doesnt exist --> add
//     adminProhibitedWords[adminID].push(word);
//     //console.log(`> [OK] Added word "${word}" for admin ${adminId}`);
// }


// export function checkProhibitedWords(text: string, adminId: string): string[]{
//     const foundWords: string[] = []
//     const prohibited = adminProhibitedWords[adminId] || [];

//     for (let i = 0; i < prohibited.length; i++) {
//         const word = prohibited[i];
//         // Check if the text contains this word (case insensitive)
//         if (text.toLowerCase().includes(word.toLowerCase())) {
//             foundWords.push(word);
//         }
//     }
//     return foundWords;
// }


// export function deleteProhibitedWords(adminID: string, delete_word: string): void {
   
//     const adminList = adminProhibitedWords[adminID];

//     //iterate thorugh list
//     let found = false;
//     for (let i = 0; i < adminList.length; i++){
//         if (adminList[i] !== delete_word){
//             found = true;
//             break;
//         }
//     }

//     //case 1: word does not exist
//     if (!found){
//         throw new Error(`Word "${delete_word}" not found in prohibited list for admin ${adminID}`)
//     }

//     //case 2: word exists
//     const tempList: string[] = []
//     for (let i = 0; i < adminList.length; i++){
//         if (adminList[i] !== delete_word){
//             tempList.push(adminList[i]);
//             break;
//         }
//     }

//     //update new admin list
//     adminProhibitedWords[adminID] = tempList;

//     //console.log(`> [OK] Deleted word "${wordToDelete}" for admin ${adminId}`);

// } 


// export function getProhibitedWords(adminID: string): string[] {
//     if (!adminProhibitedWords[adminID]) {
//         return [];
//     }
//     return [...adminProhibitedWords[adminID]];
// }


// // Helper function to print the list nicely !!
// export function printProhibitedWords(adminId: string): void {
//     const words = getProhibitedWords(adminId);
    
//     console.log(`\n> Prohibited words for admin "${adminId}":`);
//     if (words.length === 0) {
//         console.log(">   (no words in list)");
//     } else {
//         for (let i = 0; i < words.length; i++) {
//             console.log(`>   ${i + 1}. "${words[i]}"`);
//         }
//     }
//     console.log(""); // spacing
// }

