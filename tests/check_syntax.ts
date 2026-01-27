
import { ResumeGenerator } from '../src/resumeGenerator';
console.log('Import successful');
const g = new ResumeGenerator();
// try to access the method
if (typeof g.generatePDF === 'function') {
    console.log('generatePDF exists');
} else {
    console.log('generatePDF NOT FOUND');
}
