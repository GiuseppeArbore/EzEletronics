# Project Estimation - FUTURE
Date: 05/05/2024

Version: v2.1


# Estimation approach
Consider the EZElectronics  project in FUTURE version (as proposed by your team in requirements V2), assume that you are going to develop the project INDEPENDENT of the deadlines of the course, and from scratch (not from V1)
# Estimate by size
### 
|             | Estimate                        |             
| ----------- | ------------------------------- |  
| NC =  Estimated number of classes to be developed   |           7                 |             
| A = Estimated average size per class, in LOC       |           400                | 
| S = Estimated size of project, in LOC (= NC * A) |  2800 |
| E = Estimated effort, in person hours (here use productivity 10 LOC per person hour)  |               280ph                      |   
| C = Estimated cost, in euro (here use 1 person hour cost = 30 euro) | 8400euro| 
| Estimated calendar time, in calendar weeks (Assume team of 4 people, 8 hours per day, 5 days per week ) |         1.75 week       |               

# Estimate by product decomposition
### 
|         component name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Requirement document    | 50 |
| GUI prototype | 25 |
| Design document | 25 |
| Code | 70 |
| Unit tests | 40 |
| API tests | 20 |
| Management documents  | 10 |



# Estimate by activity decomposition
### 
|         Activity name    | Estimated effort (person hours)   |             
| ----------- | ------------------------------- | 
| Identificazione requisiti utenti    |         7 |
| Identificazione requisiti di performance | 4    |
| Identificazione requisiti interfaccia | 5       |
| Review dei requisiti                 | 5        |
| Definizione degli use case           | 25       |
| Definizione del design del sistema   | 5        |
| Definizione del deployment diagram   | 4        |
| Scrittura documento dei requisiti    | 10        |
| Review documento dei requisiti       | 5        |
| Analisi della GUI da realizzare      | 5        |
| Realizzazione GUI (prototipo)   | 55       |
| Sviluppo Frontend               | 60       |
| Sviluppo Backend                | 30       |
| Unit Test               | 20       |
| Integration Test               | 20       |
| E2E Test               | 20       |
| Gestione documenti         | 10        |

#### Gantt charts
![gantt_v2](./images/gantt_v2_divided.png)
*Nota 1: le barre corrispondono alle ph stimate per attività divise per il numero di persone nel team, poiché si suppone che ogni attività sia svolta parallelamente da tutti i componenti del gruppo.*

![gantt_v2](./images/gantt_v2.png)
*Nota 2: in questo caso, le barre corrispondono alle ph stimate per ogni attività, supponendo che ogni attività sia svolta da una singola persona per una maggior chiarezza.*



# Summary

Report here the results of the three estimation approaches. The  estimates may differ. Discuss here the possible reasons for the difference

|             | Estimated effort                        |   Estimated duration |          
| ----------- | ------------------------------- | ---------------|
| estimate by size |    280ph  |          1.75 week(s)               |
| estimate by product decomposition | 240ph |   1,5 week(s) |
| estimate by activity decomposition | 290 ph |  1.81 week(s) |

Le linee di codice dipendono dal linguaggio con cui si programma e da quanto il programmatore scrive il codice compatto. 
Facendo una stima secondo decomposizione per prodotti si ha una stima inferiore rispetto a quella per attività in quanto facendo una stima per attività, si va più nel dettaglio e si analizzano in maniera più approfondita le varie attività da svolgere per ottenere il prodotto, rendendosi quindi conto di ulteriori aspetti.