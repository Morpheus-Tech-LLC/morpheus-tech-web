<p align="center">
  <a href="https://morpheus-tech-llc.github.io/morpheus-tech-web/" target="_blank" rel="noopener noreferrer">
    <img src="src/assets/images/game-of-life-screenshot-readme.png" alt="Logo" width="200" height="200">
  </a>
</p>

<h3 align="center">Game of Life 3D</h3>

<div align="center">

| | |
|----------------------|--------------------------|
| **Creator:** | <a href="https://github.com/wmauz677" target="_blank" rel="noopener noreferrer">Weston Mauz</a> |
| **Company:** | Morpheus Tech LLC |
| **Release:** | v1.0 - October 31st, 2025 |
| **App** | <a href="https://morpheus-tech-llc.github.io/morpheus-tech-web/" target="_blank" rel="noopener noreferrer">Game of Life 3D</a> |

</div>

### Project Index:

1. [Mission Statement](#1-mission-statement)
2. [Rules](#2-rules)
3. [Design Methodology](#3-design-methodology)
4. [Status](#4-status)
5. [Next Steps](#5-next-steps)
6. [Run Locally](#6-run-locally)
7. [License](#7-license)
8. [Attributions](#8-attributions)

## 1. Mission Statement

The goal of this project is to explore modern computer graphics by re-imagining <a href="https://en.wikipedia.org/wiki/Conway%27s_Game_of_Life" target="_blank" rel="noopener noreferrer">Conway's Game of Life</a> in 3-Dimensions.

## 2. Rules

The original 2D rules are shown next to the new, reimagined 3D rules that are used in this project.

| Rule                        | Description                                                                                | 2D (Conway’s) | Visualization [1] | 3D |
| ---------------------------- | ------------------------------------------------------------------------------------------ | -------------- | ---------------- | --- |
| **Birth**                   | If a cell has exactly ***x*** living neighbors and is<br>initially dead, it becomes alive. | 3              | <img src="src/assets/images/rule_birth.png" alt="2D Birth" width="200" height="100"> | 9, 10 |
| **Survival**                | If a cell has ***[x,y,z]*** living neighbors, it<br>stays alive in the next generation.    | 2, 3           | <img src="src/assets/images/rule_survival.png" alt="2D Survival" width="200" height="100"> | 5–15 |
| **Death by Isolation**      | If a cell has fewer than ***x*** living<br>neighbors, it dies (becomes dead).              | 2              | <img src="src/assets/images/rule_death_isolation.png" alt="2D Death Isolation" width="200" height="100"> | 5 |
| **Death by Overcrowding**   | If a cell has more than ***x*** living neighbors, it dies.                                 | 3              | <img src="src/assets/images/rule_death_overpopulation.png" alt="2D Overcrowding" width="200" height="100"> | 11 |


### State Transition Table

| Current State | Conway’s Life – Living Neighbors | 3D Life – Living Neighbors | Next State | Rule Triggered / Reason       |
|---------------|----------------------------------|----------------------------|------------|-------------------------------|
| `1` (Alive)   | 0 – 1                            | 0 – 4                      | `0`        | **Dies** — underpopulation    |
| `1` (Alive)   | **2 – 3**                        | **5 – 15**                 | `1`        | **Survives / Lives**          |
| `1` (Alive)   | 4 – 8                            | 16 – 26                    | `0`        | **Dies** — overcrowding       |
| `0` (Dead)    | 0 – 2                            | 0 – 8                      | `0`        | Not enough neighbors / no birth |
| `0` (Dead)    | **3**                            | **9 – 10**                 | `1`        | **Birth / Reproduction**      |
| `0` (Dead)    | 4 – 8                            | 12 – 26                    | `0`        | Overcrowded — no birth        |

## 3. Design Methodology

### Tools
This project was built with vanilla javascript with the addition of the <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">three.js</a> library. <a href="https://cursor.com" target="_blank" rel="noopener noreferrer">Cursor</a>, <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer">ChatGPT</a>, & <a href="https://claude.ai/" target="_blank" rel="noopener noreferrer">Claude</a> were used to assist with writing code, researching mathematical concepts, & brainstorming different ideas. This was programmed on an M4 <a href="https://www.apple.com/mac-mini/" target="_blank" rel="noopener noreferrer">Mac Mini</a> & M1 <a href="https://www.apple.com/shop/buy-mac/macbook-air" target="_blank" rel="noopener noreferrer">Macbook Air</a> using MacOS. The development past initial publish will be done on custom hardware running <a href="https://omarchy.org" target="_blank" rel="noopener noreferrer">Omarchy</a>.

### Resources
Much of the inspiration for the design for this project was from <a href="https://www.youtube.com/@3blue1brown" target="_blank" rel="noopener noreferrer">3Blue1Brown</a>, specifically the course <a href="https://www.youtube.com/watch?v=fNk_zzaMoSs&list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab" target="_blank" rel="noopener noreferrer">Essence of linear algebra</a>. Further inspiration came from the <a href="https://lexfridman.com/podcast/" target="_blank" rel="noopener noreferrer">Lex Friedman Podcast</a>, specifically conversations with <a href="https://www.youtube.com/watch?v=ez773teNFYA" target="_blank" rel="noopener noreferrer">Stephen Wolfram</a> & <a href="https://www.youtube.com/watch?v=YDjOS0VHEr4" target="_blank" rel="noopener noreferrer">Neil Gershenfeld</a>. Two Game of Life websites also helped formulate the UI, such as <a href="https://playgameoflife.com" target="_blank" rel="noopener noreferrer">Play Game of Life</a> & <a href="https://conwaylife.com" target="_blank" rel="noopener noreferrer">Conway Life</a>. Finally, an interview of Conway himself, by <a href="https://www.youtube.com/watch?v=R9Plq-D1gEk" target="_blank" rel="noopener noreferrer">Numberphile</a>.

### Process
The original idea began on pen-and-paper, starting with a 3D drawing representing a 3D cube made of cubes (see company logo). 



The 3D model was determined to be best represented mathematically by a three dimensional matrix, as linear algebra can be leveraged for computational efficiency. The idea was then delivered to various LLM to build a prototype of the software in Python. That prototype, was then reviewed & re-written line-by-line by a human software engineer. That version was then translated to javascript by an LLM, then passed back to the human engineer to be re-written manually, again. There were many iterations & refactors performed by handing off between LLM & human engineer. The end goal of this process was to deliver software that was clearly human readable & followed software development best practices.

<p align="center">
  <img src="src/assets/images/game-of-life-3d-drawing.png" alt="drawing" height="400">
</p>

## 4. Status

### Current State
The project is currently set to build a 50x50x50 matrix & calculating 100 generations of the game of life 3D. The starting seed is a "living" cube in the center of this matrix with side length 10, where 100% of the cells in that space are alive.

### Intended Final State
The original goal was to have a 100x100x100 simulation (1 million cells), which proved to be a challenge, as the hardware used to create this project hits >100% CPU utilization when generating > 100 generations at that scale.

## 5. Next Steps
Collecting user feedback is the next phase of the project, so please reach out or tag me in your content.

### Nice-to-have feature

| # | Feature | Description |
|---|----------|-------------|
| -1 | **Starting Soups** | User can select a random soup / blob |
| 0 | **Wireframe Display** | User can switch to a wireframe display for improved viewing experience |
| 1 | **Upload Starting Seed** | User can upload a starting seed -- likely some csv of a matrix, voxel, or some 3D file type converted into a usable format |
| 2 | **Clock Visualization** | Implement a graphical clock tied directly to the simulation. |

## 6. Run Locally

1. Clone the repository
2. ```npm install```
3. ```npm run build```
4. ```npm run dev```


## 7. License

Distributed under the MIT License. See `LICENSE` for more information.

## 8. Attributions

[1] Conway's Game of Life Rules -- 2D Visualization: <a href="https://playgameoflife.com/info" target="_blank" rel="noopener noreferrer">https://playgameoflife.com/info</a>