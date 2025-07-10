export const clinicalExamDocs = {
  name: 'Australasian College of Physicians (RACP) Adult Medicine Clinical Exam',
  description:
    'The Royal Australasian College of Physicians (RACP) Adult Medicine Clinical Exam',
  image: 'https://d1p9fc0i566fiv.cloudfront.net/logo-images/racp.png',
  amount: 100,
  about: `
# RACP Adult Medicine Clinical Exam  
## A Pathway to Specialist Recognition  

The **Royal Australasian College of Physicians (RACP) Adult Medicine Clinical Exam** is a crucial milestone for medical trainees seeking specialist recognition in internal medicine across **Australia and New Zealand**. This rigorous assessment evaluates a candidate’s **clinical reasoning, diagnostic accuracy, patient interaction, and decision-making abilities** in real-world medical scenarios.  

## Exam Structure  

The RACP Adult Medicine Clinical Exam consists of **two primary components**:  

### **Long Cases (95 minutes each)**  
- **60 minutes:** Patient history-taking and physical examination.  
- **10 minutes:** Preparation of discussion points.  
- **25 minutes:** Presentation of findings and discussion with examiners.  

### **Short Cases (17 minutes each)**  
- **2 minutes:** Reading the case stem.  
- **15 minutes:** Performing a focused physical examination and discussing findings with examiners.  

## Core Competencies Assessed  

The exam is designed to test a wide range of clinical skills, including:  

✔ **History-Taking & Examination** – Demonstrating accuracy, thoroughness, and clinical insight in patient assessment.  
✔ **Diagnostic & Analytical Thinking** – Synthesizing clinical data to prioritize differential diagnoses.  
✔ **Management Planning** – Developing and justifying evidence-based treatment strategies.  
✔ **Professional Communication** – Engaging with patients, families, and colleagues with clarity, empathy, and professionalism.  
✔ **Clinical Decision-Making** – Applying medical knowledge to real-time patient scenarios, ensuring appropriate care and safety.  

## Specialties Covered  

The exam cases span multiple medical disciplines, including:  

- **Cardiology**  
- **Respiratory**  
- **Gastrointestinal**  
- **Haematology**  
- **Oncology**  
- **Rheumatology**  
- **Endocrinology**  
- **Renal**  
- **Neurology**  
- **Infectious Diseases**  

## Exam Challenges & Preparation  

Preparing for the RACP Adult Medicine Clinical Exam requires **extensive practice, exposure to diverse cases, and structured revision**. Traditional study methods may lack realism and immediate feedback, making it challenging to refine clinical skills effectively.  

## Advancing Your Exam Readiness  

With the growing role of **AI-driven learning and simulation tools**, candidates now have access to **virtual patient encounters, real-time feedback, and interactive mock exams** that replicate the real testing environment. These innovative approaches help trainees build **confidence and competence** for the RACP Clinical Exam.  

The **RACP Adult Medicine Clinical Exam** is not just a test—it’s a **defining moment** in a physician’s journey toward specialization. By mastering the clinical competencies assessed, candidates demonstrate their readiness to provide **high-quality patient care** as future specialists in internal medicine.  
`,
  markingScheme: `# RACP Adult Medicine Marking Scheme

## 1. Overview of the Exam Structure

### A. Long Cases
- **Quantity & Duration:** 2 cases, each lasting 95 minutes.
- **Structure:**
  - **Patient Interaction (60 minutes):**
    - **Review (5 minutes):** Candidate reviews the patient’s information, including medication details and instructions.
    - **Clinical Encounter (55 minutes):** Candidate performs history-taking and a comprehensive physical examination.
  - **Preparation (10 minutes):**
    - Candidate synthesizes clinical findings and organizes key discussion points.
  - **Discussion with Examiners (25 minutes):**
    - Candidate presents findings and engages in an in-depth discussion regarding diagnosis, management, and clinical reasoning.

### B. Short Cases
- **Quantity & Duration:** 4 cases, each following the process below:
  - **Read the Case Stem (2 minutes):**
    - The candidate starts by reading the short case stem, which provides background and instructions for the case.
  - **Discussion of Findings (5 minutes):**
    - After the exam, the candidate discusses their findings and outlines the next steps for the patient’s investigation.

## 2. Scoring Scale
Each case (Long or Short) is graded on a 6-point scale:

- **6:** Outstanding performance
- **5:** Above standard
- **4:** Meets standard
- **3:** Below standard
- **2:** Well below standard
- **1:** Unsatisfactory

## 3. Assessment Criteria

### A. Long Case Domains
- **Accuracy of History-Taking**
- **Accuracy of Clinical Examination**
- **Synthesis and Prioritization of Clinical Problems**
- **Impact on Patient and Family**
- **Management Plan**

### B. Short Case Domains 
- **Interpretation and Synthesis of Physical Findings**
- **Discussion of Findings and Clinical Reasoning**

## 4. Score Combination Grid and Final Result Determination
Candidate performance is determined by combining scores from Long and Short Cases using a **Banded Model**.

### Step 1: Determine the Band from Long Case Scores
- **Band 4:** Both Long Cases score ≥ 4
- **Band 3:** One Long Case scores ≥ 4 and the other scores 3
- **Band 0:** Both Long Cases score 3
- **Band 2:** One Long Case scores ≥ 4 and the other scores ≤ 2
- **Band 1:** Both Long Cases score ≤ 2

### Step 2: Evaluate Short Case Performance Based on the Determined Band
- **Band 4 Requirements:**
  - Aggregate Short Case score ≥ 16
  - At least 3 Short Cases with a score of ≥ 4
- **Band 3 Requirements:**
  - Aggregate Short Case score ≥ 15
  - At least 3 Short Cases with a score of ≥ 4
- **Band 2 Requirements:**
  - Aggregate Short Case score ≥ 14
  - At least 2 Short Cases with a score of ≥ 4
- **Band 1 Requirements:**
  - Aggregate Short Case score ≥ 13
  - At least 2 Short Cases with a score of ≥ 4
- **Band 0:**
  - Does not meet the minimum standard (e.g., both Long Cases score 3)

## 5. Examples of Score Combinations

### Example 1 – Pass:
- **Long Cases:** Scores 5 and 4 (**Band 4**)
- **Short Cases:** Scores 5, 4, 4, 4 (**Aggregate = 17**; at least 3 cases score ≥ 4)
- **Result:** Pass

### Example 2 – Fail:
- **Long Cases:** Scores 4 and 3 (**Band 3**)
- **Short Cases:** Scores 4, 3, 3, 3 (**Aggregate = 13**; only one case scores ≥ 4)
- **Result:** Fail

### Example 3 – Pass:
- **Long Cases:** Scores 4 and 2 (**Band 2**)
- **Short Cases:** Scores 5, 4, 4, 3 (**Aggregate = 16**; at least 2 cases score ≥ 4)
- **Result:** Pass`,
  sampleQuestion: {
    longCase: `
# Case Stem
A 65-year-old Caucasian male presents with progressive exertional dyspnoea, intermittent chest discomfort, and reduced exercise tolerance. Please evaluate him and prepare to discuss your assessment and management.

## Patient Profile
**Name:** Edward MORGAN  
**Date of Birth:** 10-Sep-1958  
**Age:** 65 years  
**Sex:** Male  
**Ethnicity:** Caucasian  

---

## 1. Introduction
Edward Morgan is a 65-year-old Caucasian male with a long-standing diagnosis of **Marfan's syndrome**, complicated by significant **aortic root dilation** and associated **aortic regurgitation**. In addition, he has multiple comorbidities including **hypertension, type 2 diabetes mellitus, and dyslipidaemia**. His diabetes has led to **proteinuria, chronic kidney disease (CKD stage 3b), and peripheral neuropathy** affecting his feet. He presents with **worsening exertional dyspnoea and intermittent chest discomfort**, raising concerns for **progression of his aortic regurgitation**.

---

## 2. History of Presenting Complaint
### Cardiovascular and Systemic Issues:
#### **Aortic Disease:**
- Diagnosed with **Marfan's syndrome** in his early twenties.
- Serial imaging shows **progressive aortic root dilation** and **worsening aortic regurgitation**.
- Recently experiencing **exertional dyspnoea and occasional chest pain**.

#### **Diabetes Complications:**
- Diagnosed with **type 2 diabetes** 20 years ago.
- Persistent **proteinuria** and **declining renal function** (**CKD stage 3b**).
- Reports **tingling and numbness in feet**, consistent with **diabetic peripheral neuropathy**.

#### **Hypertension:**
- Long-standing, **currently well controlled** on multiple medications.

#### **Dyslipidaemia:**
- Despite therapy, **elevated LDL levels persist**, contributing to cardiovascular risk.

---

## 3. Hospital Course
### **Past Admissions:**
- **Cardiac Monitoring:** Frequent evaluations for **aortic dilation** and **aortic regurgitation**.
  - **Last Echocardiogram (6 months ago):**  
    - **Aortic root diameter > 5.0 cm**  
    - **Moderate-to-severe aortic regurgitation**  
    - **Preserved left ventricular function**
- **Diabetes-related:**  
  - **Hyperglycemia episodes** requiring inpatient management.
  - **Recent HbA1c:** **8.5%**
  - **Persistent microalbuminuria & declining renal function.**
- **Hypertension:**  
  - Well-controlled but past **sporadic hypertensive episodes** required medication adjustments.
- **Infections:**  
  - **Treated for a UTI** last year, likely related to CKD.

---

## 4. Social History
### **Occupation & Lifestyle:**
- **Retired civil engineer**, previously enjoyed **long-distance running & cycling**.
- **Significantly reduced physical activity** due to health conditions.

### **Family & Support:**
- **Divorced, lives alone**, maintains **regular contact with two adult children**.
- **Increasing anxiety & depression** related to health deterioration.
- Reports **feelings of isolation** and **loss of independence**.

### **Habits:**
- **Non-smoker**, **occasional alcohol consumption**.

---

## 5. Review of Systems
### **Cardiovascular:**  
- **Exertional dyspnoea, intermittent chest discomfort, fatigue**.  

### **Endocrine/Metabolic:**  
- **Poor glycemic control, polyuria, polydipsia, peripheral neuropathy**.  

### **Renal:**  
- **Reduced urine output, proteinuria**.  

### **Musculoskeletal:**  
- **Marfanoid habitus (long limbs, pectus excavatum, scoliosis)**.  

### **Ocular:**  
- **Lens subluxation, corrective lenses in place**.  

### **Neurological:**  
- **Peripheral neuropathy in lower extremities**.  

### **General:**  
- **Weight loss, decreased exercise tolerance**.  

---

## 6. Past Medical History
- **Marfan's Syndrome:** Progressive **aortic root dilation & regurgitation**.
- **Hypertension:** Diagnosed **30 years ago**, well-controlled.
- **Type 2 Diabetes Mellitus:**  
  - Diagnosed **20 years ago**.  
  - Complications: **Proteinuria, CKD stage 3b, neuropathy**.
  - **Latest HbA1c:** **8.5%**
- **Dyslipidaemia:** **Persistent despite therapy**.
- **Mild Osteoarthritis.**

---

## 7. Past Surgical History
- **Cardiac:** No prior **cardiac surgeries**, regular surveillance.
- **Orthopedic:** **Corrective pectus excavatum surgery** (early 30s).
- **Ophthalmologic:** **Multiple lens subluxation procedures**.

---

## 8. Current Medications
### **Cardiac & Vascular:**
- **Metoprolol succinate 100 mg daily** (Beta-blocker)
- **Lisinopril 20 mg daily** (ACE inhibitor)
- **Hydrochlorothiazide 25 mg daily** (Diuretic)
- **Aspirin 100 mg daily**

### **Diabetes Management:**
- **Metformin 1000 mg twice daily**
- **Sitagliptin 100 mg daily** (DPP-4 inhibitor)
- **Insulin glargine 20 units at bedtime**

### **Renal Protection:**
- **ACE Inhibitor (Lisinopril, as above)**

### **Lipid Management:**
- **Atorvastatin 40 mg daily**

### **Pain Management:**
- **Gabapentin 300 mg three times daily** (Neuropathy)

---

## 9. Allergies
- **No known drug allergies.**

---

## 10. Family History
- **Father:** Coronary artery disease, MI at age **70**.
- **Diabetes:** **Family history of type 2 diabetes**.
- **Connective Tissue Disorders:** Sibling with **mild features suggestive of Marfan’s syndrome**.

---

### 11. Social History (Revisited)

#### Lifestyle and Support:
- Retired civil engineer; previously active in sports, now significantly limited by his health conditions.
- Lives alone but maintains close contact with his children.
- Experiences isolation and anxiety related to his declining health and loss of independence.

### 12. Travel History

#### Recent Travel:
- No significant recent travel reported.

### 13. Sexual History

#### Not Provided:
- Not pertinent to the current presentation.

### 14. Physical Examination

#### General Appearance:
- Tall, slender build with long limbs; classical Marfanoid habitus.
- Mild distress noted on minimal exertion.

#### Vital Signs:
- **Blood Pressure:** 130/78 mmHg (controlled)
- **Heart Rate:** 88 bpm
- **Respiratory Rate:** 18 breaths per minute
- **Oxygen Saturation:** 96% on room air
- **Temperature:** 36.8°C

#### Cardiovascular Examination:
- **Inspection:**
  - Visible Marfanoid features including pectus excavatum and scoliosis.
- **Palpation:**
  - A slightly displaced apex beat; palpable systolic thrill over the aortic area.
- **Auscultation:**
  - A harsh, crescendo-decrescendo systolic murmur at the right upper sternal border, radiating to the carotids.
  - Early diastolic murmur consistent with aortic regurgitation.
  - Slow-rising carotid pulses (pulsus parvus et tardus).

#### Respiratory Examination:
- Clear lung fields; reduced exercise tolerance noted.

#### Abdominal Examination:
- Soft, non-tender; no hepatosplenomegaly.

#### Musculoskeletal Examination:
- Notable arachnodactyly, hyperextensible joints, pectus excavatum, and scoliosis.

#### Ocular Examination:
- History of bilateral lens subluxation; current corrective lenses in place.

#### Neurological Examination:
- Reduced sensation in the lower extremities consistent with peripheral neuropathy.

### 15. Assessment Summary

Edward Morgan is a 65-year-old Caucasian male with Marfan's syndrome complicated by significant aortic root dilation and aortic regurgitation. He has multiple comorbidities including:
- Well-controlled hypertension on multiple medications.
- Type 2 diabetes mellitus with complications: proteinuria, CKD stage 3b, and peripheral neuropathy (HbA1c 8.5%).
- Dyslipidaemia, despite statin therapy.

His physical examination is notable for a harsh systolic murmur with radiation, slow-rising carotid pulses, and classic Marfanoid features. His condition has led to progressive exertional dyspnoea, intermittent chest discomfort, and overall reduced functional capacity.

### 16. Problem List and Management Plan

#### Active Problems:

**Worsening Exertional Dyspnoea and Intermittent Chest Discomfort**

**Differential Diagnosis:**
1. **Progression of Aortic Regurgitation:** Increased severity may lead to volume overload and left ventricular (LV) dysfunction.
2. **Ischaemic Heart Disease:** Coronary artery disease may coexist, contributing to chest discomfort and reduced exercise capacity.
3. **Heart Failure:** Resulting from chronic volume overload or myocardial dysfunction secondary to valvular disease or ischemia.
4. **Pulmonary Hypertension:** May develop secondary to left-sided heart disease or as an independent complication.

**Investigations:**
- **Urgent Transthoracic Echocardiogram (TTE):**
  - Reassess the severity of the known moderate to severe aortic regurgitation.
  - Evaluate the aortic root dimensions to determine any progression in dilation.
  - Look for regional wall motion abnormalities suggestive of ischaemic heart disease.
  - Assess for left ventricular dysfunction and other parameters of heart failure.
- **Myocardial Perfusion Scan:**
  - Consider for inducible ischaemia if the clinical suspicion for coronary artery disease is high.

**Management:**

- **For Aortic Regurgitation and Aortic Root Dilation:**
  - Continue regular cardiology follow-up with serial echocardiography.
  - If the echocardiogram demonstrates further progression in regurgitation severity or LV dysfunction, and if the aortic root size exceeds established thresholds, consideration should be given to aortic valve replacement.
  - Evaluate candidacy for a **Bentall's procedure** (composite aortic root replacement) if the patient meets the criteria.

- **For Ischaemic Heart Disease:**
  - Initiate or optimize anti-anginal and anti-ischaemic therapies pending further assessment.
  - If inducible ischaemia is confirmed on myocardial perfusion scanning, consider coronary revascularization as part of the overall management strategy.

- **For Heart Failure and Pulmonary Hypertension:**
  - Optimize medical management, including guideline-directed medical therapy for heart failure.
  - Assess and adjust diuretic, ACE inhibitor/ARB, and beta-blocker regimens as needed.

**Type 2 Diabetes Mellitus with Complications (Proteinuria, CKD Stage 3b, Peripheral Neuropathy)**

**Management:**
- Intensify glycemic control (review current regimen, possibly adjust insulin and oral agents).
- Nephrology referral for CKD management and proteinuria reduction strategies (ACE inhibitors already in use).
- Neuropathy management with optimization of gabapentin dosing and pain control.

**Hypertension (Well Controlled)**

**Management:**
- Continue current regimen; monitor blood pressure closely given cardiovascular risk.

**Dyslipidaemia**

**Management:**
- Continue statin therapy; consider adding ezetimibe if LDL remains elevated.

**Cardiovascular Risk and Reduced Exercise Tolerance**

**Management:**
- Regular exercise within tolerance limits, cardiac rehabilitation, and dietary modifications.

**Psychosocial Impact (Anxiety, Depression, Social Isolation)**

**Management:**
- Referral to mental health services for counseling and possible pharmacotherapy.
- Encourage participation in support groups for chronic illness.

### Inactive/Resolved Problems:
- **Past Infectious Episodes:** Urinary tract infection managed last year.
- **Surgical History of Pectus Excavatum Repair:** No ongoing issues related to the procedure.

### Conclusion
Edward Morgan is a complex patient with Marfan's syndrome and significant cardiovascular involvement, now presenting with worsening exertional dyspnoea and intermittent chest discomfort, which may indicate progression of aortic regurgitation, ischaemic heart disease, evolving heart failure, or pulmonary hypertension. His long-standing type 2 diabetes with CKD stage 3b and peripheral neuropathy, alongside well-controlled hypertension and dyslipidaemia, further complicate his profile. 

**Next Steps:**
- **Urgent transthoracic echocardiography** to reassess his aortic regurgitation severity, aortic root dimensions, regional wall motion abnormalities, and LV function.
- Consideration for **aortic valve replacement or a Bentall's procedure** if indicated.
- **Myocardial perfusion scan** to evaluate inducible ischaemia.
- **Multidisciplinary approach** to optimize his metabolic and cardiovascular risk factors, improve his quality of life, and reduce the risk of acute complications.
`,
    shortCase: `
# Case Stem
## "A 60-year-old female presents with dyspnoea. Please examine the cardiovascular system and proceed."

## Patient Profile
- **Name:** Mary TAN
- **DOB:** 15-Mar-1965
- **Age:** 60 years
- **Sex:** Female
- **Ethnicity:** Malaysian

## Cardiovascular Examination

### Preliminary Steps
- **Hand Hygiene:** Performed prior to examination.
- **Patient Positioning:** Patient positioned at a 45-degree angle.
- **Vital Signs:** Request or record vital signs if available.

### 1. General Inspection
#### Syndromic Features:
- No features suggestive of Marfan’s, Turner’s, or Down’s syndrome noted.
- No signs of Ankylosing Spondylitis or Acromegaly observed.

#### Respiratory Status:
- Dyspnoea is evident; the patient appears mildly breathless at rest with no overt cardiorespiratory distress.

### 2. Hands
- **Radial Pulses:** Palpable and symmetric bilaterally.
- **Pulse Timing:** No radiofemoral delay.
- **Clubbing:** Absent.
- **Infective Endocarditis Signs:** No splinter haemorrhages, Osler’s nodes, or peripheral stigmata.
- **Peripheral Cyanosis/Xanthomata:** Absent.

### 3. Blood Pressure
- **Recorded BP:** 130/85 mmHg.

### 4. Face and Eyes
- **Arcus Senilis:** Absent.
- **Sclerae:** No pallor or jaundice.
- **Pupils:** Equal and reactive.
- **Periocular Area:** No xanthelasma.
- **Malar Area:** No malar flush.
- **Mouth:** No cyanosis, normal palate, good dentition.

### 5. Neck
- **JVP:** Normal with no abnormal waveforms.
- **Carotid Pulses:** Normal character, but slow-rising (pulsus parvus et tardus), consistent with aortic stenosis.

### 6. Praecordium
#### Inspection:
- No scars or deformities.
- Apex beat is palpable, sustained.

#### Palpation:
- Apex beat slightly displaced (mild LV hypertrophy).
- No thrills appreciated.

#### Auscultation:
- **S1:** Normal.
- **S2:** Soft with paradoxical splitting on deep expiration.
- **Murmur:** Harsh, crescendo-decrescendo systolic ejection murmur (grade 3/6) at the right second intercostal space, radiating to the carotids.
- **Dynamic Auscultation:** Murmur intensifies with forced expiratory apnoea, consistent with severe aortic stenosis.

### 7. Back
- No scars or deformities.
- No sacral oedema.
- **Percussion/Auscultation:** No pleural effusion or lung crackles.

### 8. Abdomen
- No pulsatile liver, splenomegaly, or abnormal aortic pulsation.
- No ascites.
- **Femoral Pulses:** Normal.

### 9. Legs
- No clubbing, cyanosis, trophic changes, or pitting oedema.
- Peripheral pulses intact.
- No xanthomata or calf tenderness.

### 10. Other Examinations
- **Urine Analysis:** Not performed.
- **Fundoscopy:** Not performed.
- **Temperature Chart:** No abnormal trends.

## Summary
Mary TAN, a 60-year-old Malaysian female, presents with dyspnoea. Cardiovascular examination reveals a slow-rising carotid pulse (pulsus parvus et tardus) and a harsh, crescendo-decrescendo systolic ejection murmur, both suggestive of severe aortic stenosis. Other findings are normal, with no evidence of infective endocarditis.

## Discussion on Findings, Investigations, and Management

### Findings and Differential Diagnosis:
The key findings in Mary Tan’s cardiovascular examination include a slow-rising carotid pulse (*pulsus parvus et tardus*) and a harsh, crescendo-decrescendo systolic ejection murmur that becomes louder during forced expiratory apnoea. These features are highly suggestive of **aortic stenosis**, with the slow-rising carotid pulse supporting the likelihood of severe AS. 

#### Differential Diagnoses for a Systolic Murmur:
- **Mitral Regurgitation**: Typically presents with a pansystolic murmur, often best heard at the apex and radiating to the axilla.
- **Tricuspid Regurgitation**: Presents with a pansystolic murmur, best heard along the lower left sternal border. The murmur increases in intensity with inspiration (*Carvallo's sign*) and may radiate to the right sternal border.
- **Hypertrophic Cardiomyopathy**: May present with a systolic murmur, often accompanied by other clinical signs such as a systolic anterior motion of the mitral valve.
- **Aortic Sclerosis**: Can produce an ejection murmur, though usually not as severe and without the associated hemodynamic findings.

### Investigations:
Before definitive management, it is important to further assess the severity and implications of the suspected aortic stenosis. The following investigations are warranted:

#### **History Confirmation:**
- Confirm the patient’s history to check for symptoms attributable to AS such as **exertional dyspnoea, exertional chest discomfort, or exertional syncope**.
- Assess overall functional and cognitive status, and document any comorbidities.

#### **Echocardiography** (Cornerstone Investigation for AS):
Key echo parameters:
- **Aortic Valve Area (AVA)**: An AVA < 1.0 cm² typically confirms severe AS.
- **Peak Velocity**: Severe AS is suggested by a peak transaortic jet velocity > 4.0 m/s.
- **Mean Transvalvular Gradients**: A mean pressure gradient > 40 mmHg on echocardiography.
- **Left Ventricular Function and Hypertrophy**: Evaluates LV size and function to assess valvular impact.

#### **Electrocardiogram (ECG):**
- To confirm sinus rhythm, assess for ischemic changes, and evaluate for conduction abnormalities.

#### **Chest X-ray:**
- Assess for **cardiomegaly** and **pulmonary congestion** indicative of left ventricular failure.
- Exclude other underlying pulmonary pathology that may contribute to dyspnoea.

#### **Preoperative and General Health Assessment:**
- **Spirometry**: To evaluate pulmonary function.
- **Full Blood Count (FBC)**: To rule out anemia or infection.
- **Renal Function Tests & Liver Function Tests (LFTs)**: To assess organ function.
- **BNP & Troponin Levels**: To evaluate myocardial strain or injury.
- **Coronary Angiography**: To check for coexisting **coronary artery disease** (if valve intervention is needed, CABG may be considered).

---

### **Management:**
Management decisions are based on AS severity, symptoms, and overall health status.

#### **Symptomatic Severe AS:**
- A **multidisciplinary team** approach is essential.
- **Surgical Aortic Valve Replacement (SAVR)** is recommended for good surgical candidates.
- **Transcatheter Aortic Valve Implantation (TAVI)** is considered for high-risk surgical patients.

#### **Asymptomatic Severe AS:**
- **Close clinical follow-up** with periodic surveillance echocardiography.
- Emerging symptoms prompt **re-evaluation** and possible intervention.

#### **Multidisciplinary Approach:**
- Involves **cardiologists, cardiothoracic surgeons, and allied health professionals** (psychologists, rehabilitation specialists) to ensure a patient-centered management plan.

---

### **Conclusion:**
Mary Tan’s examination findings strongly indicate **severe aortic stenosis**. The next steps include confirming history and symptoms, performing echocardiography, and additional investigations such as **ECG, chest X-ray, and a preoperative workup**.  
Management depends on symptomatic status:
- **Symptomatic patients** → Consider **SAVR** or **TAVI**.
- **Asymptomatic patients** → **Vigilant follow-up**.`,
  },
};

export const faqsDocs = [
  {
    question: 'What is the RACP Adult Medicine Clinical Exam?',
    answer:
      'The Royal Australasian College of Physicians (RACP) Adult Medicine Clinical Exam is a high-stakes assessment for medical trainees in Australia and New Zealand. It evaluates clinical skills, patient interaction, diagnostic reasoning, and management planning through real patient encounters.',
  },
  {
    question: 'How does MedScroll help with RACP Clinical Exam preparation?',
    answer:
      'MedScroll replicates the real exam format by offering:\n ✔ AI-powered long and short case simulations\n ✔ Timed mock exams with automated scoring\n ✔ Virtual patient interactions for history-taking and physical exams\n ✔ AI-generated feedback on performance\n ✔ Case-based learning across multiple medical specialties',
  },
  {
    question:
      'Is MedScroll Clinical Exam aligned with the official RACP Clinical Exam format?',
    answer:
      'Yes! MedScroll is structured to mirror the real RACP exam by providing cases that simulate 2 Long Cases and 4 Short Cases, ensuring candidates experience the same format, timing, and assessment criteria used in the actual exam.',
  },
  {
    question: 'What is included in a Long Case simulation?',
    answer:
      'A Long Case simulation on MedScroll follows the official RACP structure:\n- **60 minutes**: History-taking and virtual physical examination\n- **10 minutes**: Candidate preparation for presentation\n- **25 minutes**: Case presentation to AI-based examiners with feedback',
  },
  {
    question: 'What is included in a Short Case simulation?',
    answer:
      'Each Short Case follows the RACP assessment format:\n- **2 minutes**: Reviewing the case scenario\n- **15 minutes**: Performing a focused physical examination and discussing findings',
  },
  {
    question: 'Does MedScroll provide feedback on my performance?',
    answer:
      'Yes! After completing a case, you’ll receive:\n ✔ AI-generated examiner-style feedback\n ✔ A breakdown of strengths and areas for improvement\n ✔ Scoring based on clinical reasoning, history-taking, and examination skills',
  },
  {
    question: 'Can I customize my learning experience?',
    answer:
      'Yes! MedScroll allows you to select cases by specialty (e.g., cardiology, neurology etc.) on practice mode.',
  },
  {
    question: 'Do I need any special software or hardware?',
    answer:
      'No, MedScroll Clinical Exam runs entirely online and works on standard browsers, tablets, and mobile devices. A stable internet connection is recommended for smooth interactions with virtual patients and AI examiners.',
  },
  {
    question: 'Is MedScroll Clinical Exams free?',
    answer:
      'No, MedScroll Clinical Exams is not free (will update it based on finalized subscription and payment plans).',
  },
  {
    question: 'What are the pricing plans for MedScroll?',
    answer:
      '(Will update it based on finalized subscription and payment plans).',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, subscriptions may be canceled at any time; however, cancellation will take effect at the end of the current subscription term, whether on a monthly or annual basis.',
  },
  {
    question: 'What if I have technical issues or need help?',
    answer:
      'MedScroll provides support through:\n- **Email Support** at hello@loopscribe.com\n- **Help Center** with FAQs',
  },
];

export const practiceCaseDocs = {
  name: 'Infectious Diseases',
  description:
    'Our infectious diseases module offers realistic cases that reflect the challenges of diagnosing and managing infections on the RACP Clinical Exam. It emphasizes critical physical examination skills and clinical reasoning, ensuring you’re well-prepared for high-stakes patient encounters.',
  image:
    'https://d1p9fc0i566fiv.cloudfront.net/logo-images/clinical-exams/infectious_diseases.png',
  logo: 'https://d1p9fc0i566fiv.cloudfront.net/logo-images/clinical-exams/infectious_diseases_.png',
};

export const instructions = {
  shortCase: `
# Short Case Practice

## Case Structure:
This Short Case is **17 minutes** in total:
- **Case Stem Reading:** 2 minutes
- **Exam Encounter:** 15 minutes
  - **8-minute physical exam encounter** (via the Physical Exam Bot)
  - **7-minute discussion** of your findings

## Self-Assessment & Feedback:
After completing each long case:
1. **Self-Assessment Form:** You will complete a self-assessment.
2. **Performance Review:** Your performance is reviewed against the **6-point scale**:
   - **1** - Unsatisfactory  
   - **2** - Well below standard  
   - **3** - Below standard  
   - **4** - Meets standard  
   - **5** - Above standard  
   - **6** - Outstanding performance
     
   **Examiners** will then discuss and reach a consensus score for each case.

3. **Personalized Feedback:**  
   Feedback is provided to help you review your performance and identify areas for improvement.

## Physical Exam Simulation:
When required during the exam encounter, **state the physical exam** you wish to perform.  
The **Physical Exam Bot** will provide corresponding findings to simulate a real patient assessment.
`,
  longCase: `
# Long Case Practice

## Case Structure:
This Long Case is **95 minutes** in total:
- **Patient Assessment/Review:** 60 minutes
- **Organize & Prepare Presentation:** 10 minutes
- **Exam Presentation:** 25 minutes

## Self-Assessment & Feedback:
After completing each long case:
1. **Self-Assessment Form:** You will complete a self-assessment.
2. **Performance Review:** Your performance is reviewed against the **6-point scale**:
   - **1** - Unsatisfactory  
   - **2** - Well below standard  
   - **3** - Below standard  
   - **4** - Meets standard  
   - **5** - Above standard  
   - **6** - Outstanding performance
     
   **Examiners** will then discuss and reach a consensus score for each case.

3. **Personalized Feedback:**  
   Feedback is provided to help you review your performance and identify areas for improvement.

## Physical Exam Simulation:
Use the **Physical Exam Bot** during your practice.  
Simply **state the exam** you want to perform _(e.g., auscultation, palpation, reflex testing)_,  
and receive **simulated clinical findings in real time**.
`,
};
