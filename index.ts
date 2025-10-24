// hent sqlite3 fra npm biblioteket
const sqlite3 = require('sqlite3');
// hent prompt sync fra npm biblioteket for å lage input listene
const spør = require('prompt-sync')(); // da får man prompt funksjonen på node

// lag en klasse
class Klasse {
    // gjort til privat
    #db;
    #solgt_list: any;
    #totalt_inntekt: number;
    // lag en constructor for lett navigering, den blir brukt i et sted
    constructor () {
        // lag en ny database kobling
        this.#db = new sqlite3.Database('database.sqlite');
        // lag et solgt list
        this.#solgt_list = [];
        this.#totalt_inntekt = 0;

        // håndtere feil for database laging
        if (!this.#db) {
            console.error("Ingen database fant!");
            return;
        }

        // begyn ved å lage listene
        this.#lag_lister();
    }

    // privat funksjon til å håndtere lagring av tomme lister
    #lag_lister(): void {
        this.#db.serialize(() => {
            const ny_list: string = 'CREATE TABLE IF NOT EXISTS'; // list laging hjelper for ny database lister

            const id: string = 'id INTEGER PRIMARY KEY'; // primary id hjelper for ny database lister
            const antall: string = 'antall REAL'; // antall hjelper for ny database lister

            // lag listene
            this.#db.run(`${ny_list} Inventar (${id}, navn TEXT, pris REAL, ${antall})`);
            this.#db.run(`${ny_list} Salg (${id}, vare_id REAL, dato TEXT, ${antall})`);

            console.log("---------- \n");

            // lag en valg input for menu systemet
            let valg = spør("Vil du lagre en vare til inventar? (ja/nei)")?.toLowerCase();

            switch (valg) {
                case "ja":
                    // kjør lagring
                    this.#lagring_av_råder();
                    break;
                // man vil fjerne
                case "nei":
                    // kjør fjerning
                    this.#slett_inventar_råder();
                    break;
                // håndtere tom valg (man vil avslutte)
                default:
                    console.log("OK!");
                    break;
            }
        });
    }

    // privat funksjon til lagring av liste råder
    #lagring_av_råder(): void {
        // lag en mock inventar
        const inventar_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
        inventar_lager.run('jus', 99, 100);

        // lag et mock salg
        const salg_lager = this.#db.prepare('INSERT INTO Salg (vare_id, dato, antall) VALUES (?, ?, ?)');
        salg_lager.run(1, '2025-05-05', 3);

        // lagre mock listene
        inventar_lager.finalize();
        salg_lager.finalize();

        // lag–lag varer input
        let lag_varer: string | null = spør("Vil du lage en vare? (ENTER - nei) ")?.toLowerCase();

        
        // lag en løkke for å håndtere laging av varer
        while (lag_varer != "ferdig" && lag_varer != "stopp" && lag_varer) { // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
            // lag en navn input
            let navn: string | null = spør("Lag navn for varen: ")?.toLowerCase();

            // håndtere ugyldig navn
            if (!navn) {
                console.error("Ugyldig navn!");
                return;
            }

            // lag en pris input
            let pris: number | null = Number(spør("Lag pris for varen: "));

            // beskytt pris mot NaN og mot ugyldig pris (0)
            if (isNaN(pris) || !pris) {
                console.error("Ugyldig pris!");
                return;
            }

            // lag antall input
            let antall: number | null = Number(spør("Lag antall av varen: "));

            // beskytt antall mot NaN og mot ugyldig antall (0)
            if (isNaN(antall) || !antall) {
                console.error("Ugyldig antall!");
                return;
            }

            // unngå inventar laging krasjer
            try {
                // lag varen i inventar
                const inventar_inp_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
                inventar_inp_lager.run(navn, pris, antall);
                inventar_inp_lager.finalize();
            } catch (err) {
                // stoppe metoden når feil skjer på catch
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke lage varen!" ${err}`);
                }
            }

            // spør igjen, samtykke
            lag_varer = spør("Vil du lage mer varer? (ENTER - nei) ")?.toLowerCase();
        }
    }

    // funksjon for å håndtere fjerning av inventar råder
    #slett_inventar_råder(): void {
        // lag fjern varer input
        let fjern_varer: string | null = spør("Vil du selge en vare? (ENTER - nei) ")?.toLowerCase();


        while (fjern_varer != "ferdig" && fjern_varer != "stopp" && fjern_varer) { // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
            // fjern navn input
            let navn: string | null = spør("Fjern varens navn: ")?.toLowerCase();

            // håndtere ugyldig navn
            if (!navn) {
                console.error("Ugyldig navn!");
                return;
            }

            // fjern pris input
            let pris: number | null = Number(spør("Fjern varens pris: "));

            // beskytt pris mot NaN og mot ugyldig pris (0)
            if (isNaN(pris) || !pris) {
                console.error("Ugyldig pris!");
                return;
            }

            // fjern antall input
            let antall: number | null = Number(spør("Fjern varens antall: "));

            // beskytt antall mot NaN og mot ugyldig antall (0)
            if (isNaN(antall) || !antall) {
                console.error("Ugyldig antall!");
                return;
            }
            
            // unngå fjerning krasjer
            try {
                // få id-en
                const id = this.#db.prepare('SELECT id FROM Inventar WHERE navn = ? AND pris = ? AND antall = ?');

                id.get(navn, pris, antall, (err: Error | null, row: any) => {
                    // håndtere ugyldig vare info
                    if (err) {
                        this.#db.close();
                        throw new Error(`Kunne ikke registrere et salg! ${err.message}`);
                    }

                    // håndtere ugyldig råd
                    if (!row) {
                        this.#db.close();
                        console.error("Ugyldig råd!");
                        return;
                    }

                    // lag salget
                    const salg_inp_lager = this.#db.prepare('INSERT INTO Salg (vare_id, dato, antall) VALUES (?, ?, ?)');
                    salg_inp_lager.run(row.id, new Date().toISOString(), antall);

                    // lag salg navnet i solgt listen
                    this.#solgt_list.push(navn);
                    // increment salg prisen for å få totalt inntekt
                    this.#totalt_inntekt += pris;

                    // registrer salget
                    salg_inp_lager.finalize();

                    // fjern varen fra inventaren
                    const inventar_inp_lager = this.#db.prepare('DELETE FROM Inventar WHERE id = ?');
                    inventar_inp_lager.run(row.id);
                    inventar_inp_lager.finalize();

                    // man samtykker ikke, vis resultatet til slutt
                    this.#hent_og_logg_lister();
                });
            } catch (err) {
                // stoppe metoden når feil skjer på catch
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke lage varen!" ${err}`);
                }
            }

            // spør igjen, samtykke
            fjern_varer = spør("Vil du selge mer varer? (ENTER - nei) ")?.toLowerCase();
        }
    }

    // privat funksjon til henting av lister for logging
    #hent_og_logg_lister(): void {
        // hent og logg data for inventar
        this.#db.each('SELECT * FROM Inventar', (err: Error | null, row: any) => {
            // håndtere ugyldig henting av lister
            if (err) {
                this.#db.close();
                throw new Error(`Kunne ikke hente data for inventar! ${err.message}`);
            }
        });

        // hent og logg data for salg
        this.#db.each('SELECT * FROM Salg', (err: Error | null, row: any) => {
            // håndtere ugyldig henting av lister
            if (err) {
                this.#db.close();
                throw new Error(`Kunne ikke hente data for salg! ${err.message}`);
            }
        });
    
        // ingen feil, logg resultatet
        console.log("Solgte varer:", this.#solgt_list);
        console.log("Inntekt:", this.#totalt_inntekt);
    }
}

// kjøre koden til klasse
new Klasse();
