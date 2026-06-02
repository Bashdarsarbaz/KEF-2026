/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Search, FileText, Check, Copy, Download, HardDrive, Cpu, AlertCircle, Info, FileCode } from 'lucide-react';
import { PHP_SOURCE_FILES } from '../data/phpCodeTemplates';
import JSZip from 'jszip';

export default function SourceViewer() {
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadingZip, setDownloadingZip] = useState<boolean>(false);

  const selectedFile = PHP_SOURCE_FILES[selectedFileIdx];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(selectedFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadAllAsZip = async () => {
    try {
      setDownloadingZip(true);
      const zip = new JSZip();

      // Fold files into zip binary Structure
      PHP_SOURCE_FILES.forEach((f) => {
        zip.file(f.filename, f.code);
      });

      // Quick Instruction manual readme
      const readme = `========================================================================
KURDISTAN EDUCATION FORUM (KEF) REGISTRATION & ATTENDANCE MANAGEMENT SYSTEM
========================================================================

SYSTEM REQUIREMENT SPECIFICATIONS
Server Environment: XAMPP (Apache + PHP 8.0+ + MySQL)
Language: HTML5, CSS3, Bootstrap 5, Vanilla JS, PHP 8+ PDO, MySQL database

DIRECTIONS TO RUN SECURELY ON XAMPP:
1. Extract this zip bundle fully.
2. Move the directory in your safe XAMPP workspace htdocs folder:
   C:\\xampp\\htdocs\\kef-system\\
3. Go to local browser to open phpMyAdmin console. Usually:
   http://localhost/phpmyadmin/
4. Establish a fresh SQL database schema:
   Database Name: kef_system
   Character Set: utf8mb4_unicode_ci
5. Import raw SQL queries inside "database/schema.sql". That automatically registers initial admin, sample invitation passes and schedule elements.
6. Open your browser program and type the destination address:
   http://localhost/kef-system/index.php
   
DEFAULT LOGIN PARAMETERS FOR DELEGATES DEMO:
- Admin Role Access:
  Email: alan.noori@kef.edu
  Password: Admin@KEF2026 (Secured via PHP password_hash)

FEATURES ENCLOSED:
- Dual-Language UI Elements (English and Kurdish Sorani)
- Double-Check Invitation Codes verification prior directory registration
- Secure cryptographic QR Code strings generated offline (Registration_ID|Full_Name|Email)
- Live Webcam video stream decoding desk or custom mock logging desk
- Dynamic Dashboard KPIs metrics chart, User Registry directories, reports exports, and agenda scheduling.

DEVELOPMENT NOTES:
- Utilizes PHP Sessions and standard PDO Prepared Statements for SQL injection protections.
- Includes cross-site scripting (XSS) input validations and CSRF guards.

Crafted for Kurdistan Education Forum (KEF).
`;
      zip.file('README_Instructions.txt', readme);

      // Deploy zip blob extraction URL
      const content = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = 'kef_xampp_php_system.zip';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setDownloadingZip(false);
    } catch (e) {
      console.error(e);
      alert('Failed to bundle resources: ' + e);
      setDownloadingZip(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-4 space-y-6 text-left">
      
      {/* Intro box */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest font-mono">Deployable Core Codebase</span>
          <h2 className="text-xl font-black mt-1">KEF PHP & MySQL Source Files</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            This workspace includes the production-grade, secure, multi-lingual PHP with PDO prepared SQL source files. Export them to execute instantly inside your local XAMPP phpMyAdmin server!
          </p>
        </div>
        <button
          onClick={downloadAllAsZip}
          disabled={downloadingZip}
          className="px-5 py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold font-mono tracking-wider shadow-md hover:shadow-lg transition disabled:opacity-50 cursor-pointer"
        >
          {downloadingZip ? 'Extruding ZIP...' : 'DOWNLOAD COMPLETE PHP/MYSQL ZIP (FOR XAMPP)'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-100 rounded-3xl p-5 shadow-sm min-h-[500px] align-stretch">
        
        {/* File Tree Selector Drawer */}
        <div className="lg:col-span-4 border-r border-slate-100 pr-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">PHP Source Tree Directory</h3>
            <div className="space-y-1.5">
              {PHP_SOURCE_FILES.map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`w-full text-left py-2 px-3 rounded-xl flex items-start gap-2.5 transition text-xs cursor-pointer ${
                    selectedFileIdx === idx
                      ? 'bg-slate-100 text-slate-800 font-bold border-l-3 border-slate-700'
                      : 'hover:bg-slate-50 text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileCode size={15} className={`mt-0.5 shrink-0 ${selectedFileIdx === idx ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-mono text-xs block leading-tight truncate">{f.filename}</span>
                    <span className="text-[10px] text-slate-400 font-normal leading-normal">{f.category.toUpperCase()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl mt-6">
            <h4 className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase mb-1">
              <Info size={13} className="text-slate-400" /> Active File Specs
            </h4>
            <p className="text-[10px] text-slate-400 leading-normal">
              {selectedFile?.description}
            </p>
          </div>
        </div>

        {/* Selected Code Content pane */}
        <div className="lg:col-span-8 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <span className="font-mono text-xs font-bold text-slate-800">{selectedFile?.filename}</span>
              <span className="text-[10px] text-slate-400 block">Category: {selectedFile?.category.toUpperCase()}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy File Content'}
            </button>
          </div>

          {/* Visual code box */}
          <div className="flex-grow overflow-auto bg-slate-950 text-slate-200 p-4 rounded-2xl border border-slate-900 font-mono text-[11px] leading-relaxed max-h-[500px]">
            <pre><code>{selectedFile?.code}</code></pre>
          </div>
        </div>
        
      </div>

    </div>
  );
}
