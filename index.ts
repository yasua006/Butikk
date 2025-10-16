// hent sqlite3 fra npm biblioteket
const sqlite3: any = require('sqlite3');
// hent prompt sync fra npm biblioteket for å lage input listene
const spør = require('prompt-sync')(); // da får man prompt funksjonen på node

// lag en klasse
class Klasse {
    #db; // gjor til privat
    // lag en constructor for lett navigering, den blir brukt i et sted
    constructor () {
        // lag en ny database kobling
        this.#db = new sqlite3.Database('database.sqlite');
        
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

            // etter på, lagre råder
            this.#lagring_av_råder();
        });
    }

    // privat funksjon til lagring av liste råder
    #lagring_av_råder(): void {
        // lag lageret for inventar (mock)
        const inventar_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
        inventar_lager.run('jus', 99, 1);

        // lag lageret for salg (mock)
        const salg_lager = this.#db.prepare('INSERT INTO Salg (vare_id, dato, antall) VALUES (?, ?, ?)');
        salg_lager.run(1585, '05-05-2025', 3);

        // kjøre lagring av mock listene
        inventar_lager.finalize();
        salg_lager.finalize();

        // lag–lag varer input
        let lag_varer: string | undefined = String(spør("Vil du lage en vare? (ENTER - nei)")?.toLowerCase());

        // lag en løkke for å håndtere laging av varer
        while (lag_varer != "ferdig" && lag_varer != "stopp" && lag_varer) { // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
            // lag en navn input
            let navn: string | null = String(spør("Lag navn for varen: ")?.toLowerCase());

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
                // lag varer fra input for inventar
                const inventar_inp_lager = this.#db.prepare('INSERT INTO Inventar (navn, pris, antall) VALUES (?, ?, ?)');
                inventar_inp_lager.run(navn, pris, antall);
                // kjøre lagring av inventar listen
                inventar_inp_lager.finalize();
            } catch (err) {
                // stoppe metoden når feil skjer på catch
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke lage varen!" ${err}`);
                }
            }

            // spør igjen, samtykke
            lag_varer = spør("Vil du lage en vare? (ENTER - nei)")?.toLowerCase();
        }

        // man samtykker ikke, vis resultat
        this.#slett_inventar_råder();
    }

    // funksjon for å håndtere fjerning av inventar råder
    #slett_inventar_råder(): void {
        // lag fjern varer input
        let fjern_varer: string | undefined = String(spør("Vil du fjerne en vare? (ENTER - nei)")?.toLowerCase());

        // fjern navn input
        let navn: string | undefined = String(spør("Fjern varens navn: ")?.toLowerCase());

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

        while (fjern_varer != "ferdig" && fjern_varer != "stopp" && fjern_varer) { // stopp om man vil ikke fortsette ("ferdig" eller "stopp" eller tom)
            // unngå fjerning krasjer
            try {
                // få id-en
                const id = this.#db.prepare('SELECT id FROM Inventar WHERE navn = ? AND pris = ? AND antall = ?');

                id.get(navn, pris, antall, (err: Error | null, row: any) => {
                    // håndtere ugyldig vare info
                    if (err) {
                        this.#db.close();
                        throw new Error(`Kunne ikke fjerne varen fra inventar! ${err.message}`);
                    }

                    // håndtere ugyldig råd
                    if (!row) {
                        this.#db.close();
                        console.error("Fant ikke varen for inventar!");
                        return;
                    }

                    // fjern varene for inventar
                    const inventar_inp_lager = this.#db.prepare('DELETE FROM Inventar WHERE id = ?');
                    inventar_inp_lager.run(row.id);

                    // lag salget
                    const salg_inp_lager = this.#db.prepare('INSERT INTO Salg (vare_id, dato, antall) VALUES (?, ?, ?)');
                    salg_inp_lager.run(row.id, new Date().toISOString(), antall);

                    // fjern fra inventar
                    inventar_inp_lager.finalize();
                    // registrer salget
                    salg_inp_lager.finalize();
                });
            } catch (err) {
                // stoppe metoden når feil skjer på catch
                if (err) {
                    this.#db.close();
                    throw new Error(`Kunne ikke lage varen!" ${err}`);
                }
            }

            // spør igjen, samtykke
            fjern_varer = spør("Vil du fjerne en vare? (ENTER - nei)")?.toLowerCase();
        }

        // man samtykker ikke, vis resultat
        this.#hent_og_logg_lister();
        console.log("OK!");
    }

    // privat funksjon til henting av lister for logging
    #hent_og_logg_lister(): void {
        // hent og logg data for inventar
        this.#db.each('SELECT * FROM Inventar', (err: Error | null, row: any) => {
            // håndtere ugyldig henting av lister
            if (err) {
                this.#db.close();
                throw new Error(`Kunne ikke hente data for inventar (mock)! ${err.message}`);
            }

            // ingen feil, logg resultatet
            console.log(row);
        });

        // hent og logg data for salg
        this.#db.each('SELECT * FROM Salg', (err: Error | null, row: any) => {
            // håndtere ugyldig henting av lister
            if (err) {
                this.#db.close();
                throw new Error(`Kunne ikke hente data for salg (mock)! ${err.message}`);
            }

            // ingen feil, logg resultatet
            console.log(row);
        });
    }
}

// kjøre koden til klasse
new Klasse();
