"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card"
import { Button } from "../../ui/button"
import { Upload, FileSpreadsheet, ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import { Input } from "../../ui/input"

const DEPARTMENTS: string[] = [
  "Computer Science and Engineering",
  "Artificial Intelligence and Data Science",
  "Civil Engineering",
  "Cyber Security",
  "Computer Science with Artificial Intelligence",
  "Electronics and Communications Engineering",
  "Electronics and Computer Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering"
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8].map((semester) => `S${semester}`)

const SYLLABUS: Record<string, Record<string, { name: string; code: string }[]>> = {
  "S1": {
    "All": [
      { name: "Linear Algebra", code: "MAT 101" },
      { name: "Engineering Physics A", code: "PHT 100" },
      { name: "Engineering Physics B", code: "PHT 110" },
      { name: "Engineering Graphics", code: "EST 110" },
      { name: "Life Skills", code: "HUN 101" },
      { name: "Engineering Chemistry", code: "CYT 100" },
      { name: "Engineering Mechanics", code: "EST 100" },
      { name: "Basics of Civil and Mechanical Engineering", code: "EST 120" },
      { name: "Basics of Electrical and Electronic Engineering", code: "EST 130" }
    ]
  },
  "S2": {
    "All": [
      { name: "Vector Calculus, Differential Equation", code: "MAT 102" },
      { name: "Professional Communication", code: "HUN 102" },
      { name: "Programming in C", code: "EST 102" },
      { name: "Engineering Physics A", code: "PHT 100" },
      { name: "Engineering Physics B", code: "PHT 110" },
      { name: "Engineering Graphics", code: "EST 110" },
      { name: "Engineering Chemistry", code: "CYT 100" },
      { name: "Engineering Mechanics", code: "EST 100" }
    ]
  },
  "S3": {
    "Computer Science and Engineering": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Artificial Intelligence and Data Science": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Civil Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Mechanics of Solids", "code": "CET 201" },
      { "name": "Fluid Mechanics and Hydraulics", "code": "CET 203" },
      { "name": "Surveying and Geomatics", "code": "CET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Cyber Security": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Electrical and Electronics Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Circuits and Networks", "code": "EET 201" },
      { "name": "Measurements and Instrumentation", "code": "EET 203" },
      { "name": "Analog Electronics", "code": "EET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Electronics and Communications Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Solid State Devices", "code": "ECT 201" },
      { "name": "Logic Circuit Design", "code": "ECT 203" },
      { "name": "Network Theory", "code": "ECT 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Mechanical Engineering": [
      { "name": "Partial Differential Equation & Complex Analysis", "code": "MAT 201" },
      { "name": "Mechanics of Solids", "code": "MET 201" },
      { "name": "Mechanics of Fluids", "code": "MET 203" },
      { "name": "Metallurgy & Material Science", "code": "MET 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Computer Science with Artificial Intelligence": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Object Oriented Programming using Java", "code": "CST 205" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],

    "Electronics and Computer Engineering": [
      { "name": "Discrete Mathematical Structures", "code": "MAT 203" },
      { "name": "Solid State Devices", "code": "ECT 201" },
      { "name": "Logic System Design", "code": "CST 203" },
      { "name": "Data Structures", "code": "CST 201" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ]
  },

  "S4": {
   "Computer Science and Engineering": [
      { "name": "Graph Theory", "code": "MAT 206" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Database Management Systems", "code": "CST 204" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to Artificial Intelligence", "code": "ADT 202" },
      { "name": "Data Storage and Management", "code": "ADT 204" },
      { "name": "Machine Learning", "code": "ADT 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Civil Engineering": [
      { "name": "Vector Calculus, Differential Equations and Transforms", "code": "MAT 202" },
      { "name": "Engineering Geology", "code": "CET 202" },
      { "name": "Structural Analysis I", "code": "CET 204" },
      { "name": "Transportation Engineering", "code": "CET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Cyber Security": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to Cyber Security", "code": "CZT 202" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Probability, Statistics and Numerical Methods", "code": "MAT 256" },
      { "name": "Introduction to AI", "code": "AIT 202" },
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Probability, Distributions and Numerical Methods", "code": "MAT 204" },
      { "name": "Analog Circuits", "code": "ECT 202" },
      { "name": "Signals and Systems", "code": "ECT 204" },
      { "name": "Computer Organization", "code": "ECT 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Computer Organization and Architecture", "code": "CST 202" },
      { "name": "Analog Circuits", "code": "ECT 202" },
      { "name": "Operating Systems", "code": "CST 206" },
      { "name": "Signals and Systems", "code": "ECT 204" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Probability, Distributions and Numerical Methods", "code": "MAT 204" },
      { "name": "DC Machines and Transformers", "code": "EET 202" },
      { "name": "Digital Electronics", "code": "EET 204" },
      { "name": "Power System I", "code": "EET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ],
    "Mechanical Engineering": [
      { "name": "Vector Calculus, Differential Equations and Transforms", "code": "MAT 202" },
      { "name": "Engineering Thermodynamics", "code": "MET 202" },
      { "name": "Manufacturing Process", "code": "MET 204" },
      { "name": "Machine Tools and Metrology", "code": "MET 206" },
      { "name": "Sustainable Engineering", "code": "MCN 201" },
      { "name": "Constitution of India", "code": "MCN 202" },
      { "name": "Design and Engineering", "code": "EST 200" },
      { "name": "Professional Ethics", "code": "HUT 200" }
    ]
  },
  "S5": {
  "Computer Science and Engineering": [
      { "name": "Formal Languages and Automata Theory", "code": "CST 301" },
      { "name": "Computer Networks", "code": "CST 303" },
      { "name": "System Software", "code": "CST 305" },
      { "name": "Microprocessors and Microcontrollers", "code": "CST 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Civil Engineering": [
      { "name": "Structural Analysis II", "code": "CET 301" },
      { "name": "Design of Concrete Structures I", "code": "CET 303" },
      { "name": "Geotechnical Engineering I", "code": "CET 305" },
      { "name": "Hydrology & Water Resources Engineering", "code": "CET 307" },
      { "name": "Management for Engineers", "code": "CET 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Linear Integrated Circuits", "code": "ECT 301" },
      { "name": "Digital Communication", "code": "ECT 303" },
      { "name": "Electromagnetic Waves", "code": "ECT 305" },
      { "name": "Control Systems", "code": "ECT 307" },
      { "name": "Management for Engineers", "code": "HUT 310" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Power System II", "code": "EET 301" },
      { "name": "Microprocessors and Microcontrollers", "code": "EET 303" },
      { "name": "Signals and Systems", "code": "EET 305" },
      { "name": "Synchronous and Induction Machines", "code": "EET 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Mechanical Engineering": [
      { "name": "Mechanics of Machinery", "code": "MET 301" },
      { "name": "Thermal Engineering I", "code": "MET 303" },
      { "name": "Industrial Engineering", "code": "MET 305" },
      { "name": "Design of Machine Elements I", "code": "MET 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Foundations of Machine Learning", "code": "ADT 301" },
      { "name": "Database Management Systems", "code": "ADT 303" },
      { "name": "Operating Systems", "code": "ADT 305" },
      { "name": "Programming with Python", "code": "ADT 307" },
      { "name": "Principles of Management", "code": "ADT 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Cyber Security": [
      { "name": "Cryptography", "code": "CZT 301" },
      { "name": "Network Security", "code": "CZT 303" },
      { "name": "Secure Coding", "code": "CZT 305" },
      { "name": "Digital Forensics", "code": "CZT 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Machine Learning", "code": "AIT 301" },
      { "name": "Artificial Intelligence", "code": "AIT 303" },
      { "name": "Data Analytics", "code": "AIT 305" },
      { "name": "Neural Networks", "code": "AIT 307" },
      { "name": "Management of Software Systems", "code": "CST 309" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Database Management Systems", "code": "CST 204" },
      { "name": "Digital Communication", "code": "ECT 303" },
      { "name": "Electromagnetic Waves", "code": "ECT 305" },
      { "name": "Microprocessors and Microcontrollers", "code": "CST 307" },
      { "name": "Disaster Management", "code": "MCN 301" }
    ]
  },
  "S6": {
    "Computer Science and Engineering": [
      { "name": "Compiler Design", "code": "CST 302" },
      { "name": "Computer Graphics and Image Processing", "code": "CST 304" },
      { "name": "Algorithm Analysis and Design", "code": "CST 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Comprehensive Course Work", "code": "CST 308" },
      { "name": "Foundations of Machine Learning", "code": "CST 312" },
      { "name": "Data Analytics", "code": "CST 322" },
      { "name": "Foundations of Security in Computing", "code": "CST 332" },
      { "name": "Programming in Python", "code": "CST 362" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Electromagnetics", "code": "ECT 302" },
      { "name": "VLSI Design", "code": "ECT 304" },
      { "name": "Digital Signal Processing", "code": "ECT 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Embedded Systems", "code": "ECT 312" },
      { "name": "Information Theory and Coding", "code": "ECT 322" },
      { "name": "Data Structures", "code": "ECT 362" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Power Electronics", "code": "EET 302" },
      { "name": "Control Systems", "code": "EET 304" },
      { "name": "Power System Analysis", "code": "EET 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Electric Vehicles", "code": "EET 322" },
      { "name": "Renewable Energy Systems", "code": "EET 342" },
      { "name": "Digital Control Systems", "code": "EET 362" }
    ],
    "Mechanical Engineering": [
      { "name": "Heat and Mass Transfer", "code": "MET 302" },
      { "name": "Advanced Manufacturing Technology", "code": "MET 304" },
      { "name": "Material Handling & Facilities Planning", "code": "MET 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Non-Destructive Testing", "code": "MET 312" },
      { "name": "Industrial Safety", "code": "MET 322" },
      { "name": "Automobile Engineering", "code": "MET 342" },
      { "name": "Computational Fluid Dynamics", "code": "MET 362" }
    ],
    "Civil Engineering": [
      { "name": "Design of Steel Structures", "code": "CET 302" },
      { "name": "Environmental Engineering I", "code": "CET 304" },
      { "name": "Design of Concrete Structures II", "code": "CET 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Advanced Structural Analysis", "code": "CET 312" },
      { "name": "Geotechnical Engineering II", "code": "CET 322" },
      { "name": "Transportation Engineering II", "code": "CET 332" },
      { "name": "Water Resources Engineering", "code": "CET 362" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Soft Computing", "code": "ADT 302" },
      { "name": "Data Visualization", "code": "ADT 304" },
      { "name": "Natural Language Processing", "code": "ADT 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Advanced Machine Learning", "code": "ADT 312" },
      { "name": "Data Mining and Data Warehousing", "code": "ADT 322" },
      { "name": "Graph Theory", "code": "ADT 332" },
      { "name": "Optimization Techniques", "code": "ADT 362" }
    ],
    "Cyber Security": [
      { "name": "Cloud Security", "code": "CZT 302" },
      { "name": "Ethical Hacking", "code": "CZT 304" },
      { "name": "Cyber Laws and Ethics", "code": "CZT 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Mobile Security", "code": "CZT 312" },
      { "name": "Malware Analysis", "code": "CZT 322" },
      { "name": "IoT Security", "code": "CZT 332" },
      { "name": "Wireless Security", "code": "CZT 362" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Cognitive Science", "code": "AIT 302" },
      { "name": "Algorithm Analysis and Design", "code": "CST 306" },
      { "name": "Computer Graphics", "code": "CST 304" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Robotics and AI", "code": "AIT 312" },
      { "name": "Computer Vision", "code": "AIT 322" },
      { "name": "Fuzzy Systems", "code": "AIT 332" },
      { "name": "Deep Learning for AI", "code": "AIT 362" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Computer Networks", "code": "CST 303" },
      { "name": "VLSI Design", "code": "ECT 304" },
      { "name": "Digital Signal Processing", "code": "ECT 306" },
      { "name": "Industrial Economics & Foreign Trade", "code": "HUT 300" },
      { "name": "Embedded Systems", "code": "ECT 312" },
      { "name": "Object Oriented Programming", "code": "CST 362" }
    ]
  },
  "S7": {
   "Computer Science and Engineering": [
      { "name": "Artificial Intelligence", "code": "CST 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Machine Learning", "code": "CST 413" },
      { "name": "Cloud Computing", "code": "CST 423" },
      { "name": "Security in Computing", "code": "CST 433" },
      { "name": "Model Based Software Development", "code": "CST 443" },
      { "name": "Advanced Topics in IA32 Architecture", "code": "CST 453" },
      { "name": "Web Programming", "code": "CST 463" },
      { "name": "Natural Language Processing", "code": "CST 473" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Microwave and Antennas", "code": "ECT 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Machine Learning", "code": "ECT 413" },
      { "name": "Optical Communication", "code": "ECT 423" },
      { "name": "Satellite Communication", "code": "ECT 433" },
      { "name": "Digital Image Processing", "code": "ECT 463" },
      { "name": "Advanced Digital Signal Processing", "code": "ECT 473" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Advanced Control Systems", "code": "EET 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Electric Drives", "code": "EET 413" },
      { "name": "Biomedical Instrumentation", "code": "EET 423" },
      { "name": "Object Oriented Programming", "code": "EET 433" },
      { "name": "Digital Signal Processing", "code": "EET 453" }
    ],
    "Mechanical Engineering": [
      { "name": "Control Systems", "code": "MET 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Advanced Internal Combustion Engines", "code": "MET 413" },
      { "name": "Optimization Techniques", "code": "MET 423" },
      { "name": "Finite Element Analysis", "code": "MET 433" },
      { "name": "Advanced Heat Transfer", "code": "MET 415" },
      { "name": "Design of Transmission Systems", "code": "MET 425" },
      { "name": "Entrepreneurship and Management", "code": "MET 435" }
    ],
    "Civil Engineering": [
      { "name": "Environmental Engineering II", "code": "CET 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Prestressed Concrete", "code": "CET 413" },
      { "name": "Ground Improvement Techniques", "code": "CET 423" },
      { "name": "Air Quality Management", "code": "CET 433" },
      { "name": "Design of Bridges", "code": "CET 415" },
      { "name": "Construction Project Management", "code": "CET 425" },
      { "name": "Environmental Impact Assessment", "code": "CET 435" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Deep Learning", "code": "ADT 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Cloud Computing", "code": "ADT 413" },
      { "name": "Web Programming", "code": "ADT 423" },
      { "name": "Big Data Analytics", "code": "ADT 433" },
      { "name": "Computer Vision", "code": "ADT 463" },
      { "name": "Bioinformatics", "code": "ADT 473" }
    ],
    "Cyber Security": [
      { "name": "Artificial Intelligence in Cyber Security", "code": "CZT 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Penetration Testing", "code": "CZT 413" },
      { "name": "Information Security Auditing", "code": "CZT 423" },
      { "name": "Security Operations Center", "code": "CZT 433" },
      { "name": "Steganography", "code": "CZT 463" },
      { "name": "Intrusion Detection Systems", "code": "CZT 473" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Deep Learning", "code": "AIT 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Reinforcement Learning", "code": "AIT 413" },
      { "name": "Big Data Systems", "code": "AIT 423" },
      { "name": "Natural Language Processing", "code": "AIT 433" },
      { "name": "Knowledge Representation", "code": "AIT 463" },
      { "name": "Search Engine Optimization", "code": "AIT 473" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Embedded System Design", "code": "ECT 401" },
      { "name": "Industrial Safety Engineering", "code": "MCN 401" },
      { "name": "Real Time Systems", "code": "ERT 413" },
      { "name": "Cyber Security", "code": "ERT 423" },
      { "name": "Cloud Computing", "code": "ERT 433" }
    ]
  },
  "S8": {
    "Computer Science and Engineering": [
      { "name": "Distributed Computing", "code": "CST 402" },
      { "name": "Deep Learning", "code": "CST 414" },
      { "name": "Programming Paradigms", "code": "CST 424" },
      { "name": "Cryptography", "code": "CST 434" },
      { "name": "Soft Computing", "code": "CST 444" },
      { "name": "Fuzzy Set Theory and Applications", "code": "CST 454" },
      { "name": "Embedded Systems", "code": "CST 464" },
      { "name": "Computer Vision", "code": "CST 474" },
      { "name": "Formal Methods and Tools in Software Engineering", "code": "CST 416" },
      { "name": "Client Server Architecture", "code": "CST 426" },
      { "name": "Parallel Computing", "code": "CST 436" },
      { "name": "Data Compression Techniques", "code": "CST 446" },
      { "name": "Unified Extended Firmware Interface", "code": "CST 456" },
      { "name": "Data Mining", "code": "CST 466" },
      { "name": "Mobile Computing", "code": "CST 476" },
      { "name": "High Performance Computing", "code": "CST 418" },
      { "name": "Block Chain Technologies", "code": "CST 428" },
      { "name": "Image Processing Technique", "code": "CST 438" },
      { "name": "Internet of Things", "code": "CST 448" },
      { "name": "Software Testing", "code": "CST 458" },
      { "name": "Bioinformatics", "code": "CST 468" },
      { "name": "Computational Linguistics", "code": "CST 478" }
    ],
    "Electronics and Communications Engineering": [
      { "name": "Mixed Signal Design", "code": "ECT 402" },
      { "name": "Nanoelectronics", "code": "ECT 414" },
      { "name": "Computer Communication Networks", "code": "ECT 424" },
      { "name": "Robotics", "code": "ECT 434" },
      { "name": "CMOS Circuit Design", "code": "ECT 464" },
      { "name": "Internet of Things", "code": "ECT 474" }
    ],
    "Electrical and Electronics Engineering": [
      { "name": "Electrical Machine Design", "code": "EET 402" },
      { "name": "Power Quality", "code": "EET 414" },
      { "name": "Advanced Power Electronics", "code": "EET 424" },
      { "name": "Energy Management", "code": "EET 434" },
      { "name": "Smart Grid", "code": "EET 444" }
    ],
    "Mechanical Engineering": [
      { "name": "Energy Engineering", "code": "MET 402" },
      { "name": "Renewable Energy Engineering", "code": "MET 414" },
      { "name": "Gas Dynamics and Jet Propulsion", "code": "MET 424" },
      { "name": "Robotics", "code": "MET 434" },
      { "name": "Advanced Manufacturing Technology", "code": "MET 416" },
      { "name": "Mechatronics", "code": "MET 426" },
      { "name": "Computer Integrated Manufacturing", "code": "MET 436" }
    ],
    "Civil Engineering": [
      { "name": "Quantity Surveying and Valuation", "code": "CET 402" },
      { "name": "Advanced Foundation Engineering", "code": "CET 414" },
      { "name": "Industrial Waste Management", "code": "CET 424" },
      { "name": "Pavement Evaluation and Management", "code": "CET 434" },
      { "name": "Construction Planning and Management", "code": "CET 416" },
      { "name": "Geo-environmental Engineering", "code": "CET 426" },
      { "name": "Structural Dynamics", "code": "CET 436" }
    ],
    "Artificial Intelligence and Data Science": [
      { "name": "Reinforcement Learning", "code": "ADT 402" },
      { "name": "Distributed Computing", "code": "ADT 414" },
      { "name": "Blockchain Technologies", "code": "ADT 424" },
      { "name": "Edge Computing", "code": "ADT 434" },
      { "name": "Ethics in AI", "code": "ADT 444" },
      { "name": "Video Analytics", "code": "ADT 464" },
      { "name": "Social Network Analysis", "code": "ADT 474" }
    ],
    "Cyber Security": [
      { "name": "Blockchain Technologies", "code": "CZT 402" },
      { "name": "Cyber Warfare", "code": "CZT 414" },
      { "name": "Secure Software Engineering", "code": "CZT 424" },
      { "name": "Quantum Cryptography", "code": "CZT 434" },
      { "name": "Biometric Security", "code": "CZT 444" },
      { "name": "Advanced Malware Analysis", "code": "CZT 464" },
      { "name": "Cyber Incident Response", "code": "CZT 474" }
    ],
    "Computer Science with Artificial Intelligence": [
      { "name": "Human Computer Interaction", "code": "AIT 402" },
      { "name": "Multi-agent Systems", "code": "AIT 414" },
      { "name": "AI in Healthcare", "code": "AIT 424" },
      { "name": "Expert Systems", "code": "AIT 434" },
      { "name": "Game Theory and AI", "code": "AIT 444" },
      { "name": "Speech Processing", "code": "AIT 464" },
      { "name": "Autonomous Systems", "code": "AIT 474" }
    ],
    "Electronics and Computer Engineering": [
      { "name": "Distributed Systems", "code": "CST 402" },
      { "name": "Internet of Things", "code": "ERT 414" },
      { "name": "Artificial Intelligence", "code": "ERT 424" },
      { "name": "Mobile Computing", "code": "ERT 434" }
    ]
  }
};

interface FileWithTags {
  id: string
  file: File
  batch: string
  semester: string
  dept: string
  subjectName: string
  subjectCode: string
  division: string
}

export function DataImportInternal({ onUpload, onBack }: { onUpload: (data: any) => void; onBack: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileEntries, setFileEntries] = useState<FileWithTags[]>([])

  const processFiles = (files: File[]) => {
    const newEntries: FileWithTags[] = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f,
      batch: "",
      semester: "",
      dept: "",
      subjectName: "",
      subjectCode: "",
      division: ""
    }))
    setFileEntries(prev => [...prev, ...newEntries])
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => /\.(csv|xlsx|xls)$/i.test(f.name))
    processFiles(dropped)
  }, [])

  const updateTag = (id: string, field: keyof FileWithTags, value: string) => {
    setFileEntries(prev => prev.map(entry => {
      if (entry.id !== id) return entry;
      const updated = { ...entry, [field]: value };

      if (field === "batch" || field === "semester" || field === "dept") {
        updated.subjectName = "";
        updated.subjectCode = "";
        return updated;
      }
      
      if (field === "subjectName") {
        const semesterData = SYLLABUS[updated.semester];
        const deptData = semesterData?.[updated.dept] || semesterData?.["All"];
        const subject = deptData?.find(s => s.name === value);
        updated.subjectCode = subject ? subject.code : "";
      }
      return updated;
    }))
  }

  const removeFile = (id: string) => setFileEntries(prev => prev.filter(e => e.id !== id))

  const getSubjects = (batch: string, semester: string, dept: string) => {
    if (!batch || !semester) return [];
    if (!semester) return [];
    const semesterData = SYLLABUS[semester];
    if (!semesterData) return [];
    if (["S1", "S2"].includes(semester)) return semesterData["All"] || [];
    return semesterData[dept] || [];
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Internal Exam Upload</CardTitle>
        <p className="text-sm text-muted-foreground">Upload files and tag specific details for each</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          }`}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-lg">Upload Student Data</p>
              <p className="text-sm text-muted-foreground">Drag and drop your files here, or click to browse</p>
            </div>
            <input type="file" multiple accept=".csv,.xlsx,.xls" className="hidden" id="file-input" 
              onChange={(e) => processFiles(Array.from(e.target.files || []))} 
            />
            <label htmlFor="file-input">
              <Button variant="outline" asChild className="cursor-pointer">
                <span>Browse Files</span>
              </Button>
            </label>
          </div>
        </div>

        {/* --- SCROLLER --- */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {fileEntries.map((entry) => {
            const availableSubjects = getSubjects(entry.batch, entry.semester, entry.dept);
            return (
              <div key={entry.id} className="p-4 border rounded-lg bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-sm font-semibold truncate max-w-xs">{entry.file.name}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeFile(entry.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-blue-600 outline-none"
                    value={entry.batch} 
                    onChange={e => updateTag(entry.id, "batch", e.target.value)}
                  >
                    <option value="">Select Batch</option>
                    <option value="autonomous">Autonomous</option>
                    <option value="ktu">KTU</option>
                  </select>

                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    value={entry.semester} 
                    onChange={e => updateTag(entry.id, "semester", e.target.value)}
                    disabled={!entry.batch}
                  >
                    <option value="">Select Semester</option>
                    {SEMESTERS.map(s => <option key={s} value={s}>Semester {s.slice(1)}</option>)}
                  </select>

                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                    value={entry.dept} 
                    onChange={e => updateTag(entry.id, "dept", e.target.value)}
                    disabled={!entry.batch || !entry.semester}
                  >
                    <option value="">Select Branch / Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>

                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 outline-none md:col-span-2"
                    value={entry.subjectName} 
                    onChange={e => updateTag(entry.id, "subjectName", e.target.value)}
                    disabled={!entry.batch || !entry.semester || !entry.dept || !availableSubjects.length}
                  >
                    <option value="">Select Subject</option>
                    {availableSubjects.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>

                  <Input placeholder="Course Code" value={entry.subjectCode} readOnly className="bg-slate-100" />
                  <Input placeholder="Division (e.g. A, B)" value={entry.division} onChange={e => updateTag(entry.id, "division", e.target.value)} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button 
            disabled={fileEntries.length === 0 || fileEntries.some(e => !e.subjectCode)} 
            onClick={() => onUpload({ type: "internal", data: fileEntries })}
          >
            Preview Data
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}