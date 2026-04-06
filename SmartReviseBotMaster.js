(async () => {
    const sleep = async (ms) => await new Promise(res => setTimeout(res, ms));
    let learningDatabase = {}; 
    let conversationHistory = [];
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 3000;
    const RATE_LIMIT_DELAY = 10000;

    // Enhanced debug logging
    const debug = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        element: (selector) => {
            const el = $(selector);
            console.log(`Element ${selector}:`, el.length ? 'Found' : 'NOT FOUND');
            if (el.length) {
                console.log('Content:', el.text().trim());
                console.log('Classes:', el.attr('class'));
            }
        }
    };

    // Helper function to normalize answer text (remove markers and trim)
    const normalizeAnswer = (text) => text.replace(/^[✔✗]\s*/, '').trim().toLowerCase();

    const answerQuestion = async () => {
        try {
            debug.log('\n\n--- Starting new question ---');
            
            // Rate limiting protection
            const timeSinceLastRequest = Date.now() - lastRequestTime;
            if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
                await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
            }

            await sleep(2000);
            debug.log('waiting...');

            // Debug all important elements
            debug.element('#questiontext');
            debug.element('#answercontainer');
            debug.element('.col-12.mb-1:first');
            debug.element('.js_answerButton:first');
            debug.element('#lnkNext');

            const answers = [...$('#answercontainer').find('.col-12.mb-1')];
            const questionText = $('#questiontext').text().trim();
            
            if (answers.length === 0) {
                debug.error('No answers found... Structure:');
                console.dir(document.body.innerHTML);
                await sleep(5000);
                await proceedToNext();
                return await answerQuestion();
            }

            debug.log(`Found ${answers.length} answers for question: "${questionText}"`);

            // choices
            const currentAnswers = answers.map(el => normalizeAnswer($(el).text()));
            const answerChoices = currentAnswers.map((text, i) => `${i}: ${text}`).join('\n');

            // Check Database
            if (learningDatabase[questionText]) {
                const knownAnswers = learningDatabase[questionText];
                let correctIndex = -1;
                
                // Attempt to find answer text
                currentAnswers.some((answerText, index) => {
                    if (knownAnswers[answerText] !== undefined) {
                        correctIndex = index;
                        return true;
                    }
                    return false;
                });

                if (correctIndex !== -1) {
                    debug.log('Using known correct answer:', correctIndex, currentAnswers[correctIndex]);
                    $(answers[correctIndex]).find('.js_answerButton').click();
                    await proceedToNext();
                    return await answerQuestion();
                }
            }

            debug.log('Choices prepared for GROQ:', answerChoices);

            // Build 
            let messages = [
                {
                    role: "system",
                    content: `You are an expert computer science tutor which only uses GCSE AQA language. Answer multiple-choice questions by responding ONLY with the number (0-${answers.length - 1}). 
                    Never respond with -1. If uncertain, make your best educated guess. Remember previous corrections when answering similar questions.`
                },
                ...conversationHistory
            ];

            // Add question
            messages.push({
                role: "user",
                content: `Question: ${questionText}\n\nAnswers:\n${answerChoices}\n\nRespond ONLY with the number.`
            });

            debug.log("Generating request for Groq");
            lastRequestTime = Date.now();
            
            let res;
            try {
                debug.log('Sending request to Groq...');
                const req = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer key_here' //PUT YOUR GROQ API KEY IN HERE (MAKE SURE TO KEEP 'BEARER')
                    },
                    body: JSON.stringify({
                        model: 'meta-llama/llama-4-scout-17b-16e-instruct', //change model to your liking
                        messages: messages,
                        temperature: 0.3,
                        max_tokens: 5
                    })
                });
                
                if (!req.ok) {
                    debug.error(`request failed: ${req.status}`);
                    if (req.status === 429) {
                        debug.warn('Rate limited - waiting', RATE_LIMIT_DELAY, 'ms');
                        await sleep(RATE_LIMIT_DELAY);
                        return await answerQuestion();
                    }
                    throw new Error(`request failed: ${req.status}`);
                }
                
                res = await req.json();
                debug.log('response received:', res);
            } catch (error) {
                debug.error('request error:', error);
                await sleep(RATE_LIMIT_DELAY);
                return await answerQuestion();
            }

            const aiText = res?.choices?.[0]?.message?.content || '';
            const answerMatch = aiText.match(/\d+/);
            const answerIndex = answerMatch ? parseInt(answerMatch[0]) : -1;

            debug.log(`groq selected index: ${answerIndex}`);

            // Validate answer index
            if (answerIndex >= 0 && answerIndex < answers.length) {
                debug.log(`Selecting answer ${answerIndex}:`, currentAnswers[answerIndex]);
                $(answers[answerIndex]).find('.js_answerButton').click();
            } else {
                debug.warn('Invalid answer index, selecting random answer');
                const randomIndex = Math.floor(Math.random() * answers.length);
                $(answers[randomIndex]).find('.js_answerButton').click();
            }

            debug.log('Waiting for result...');
            await waitForFeedback();

            // IMPROVED DETECTION USING CLASS'S
            let isCorrect = false;
            let correctIndex = -1;
            let correctAnswerText = '';
            
            // Check answer for succes or failure
            answers.forEach((el, i) => {
                const button = $(el).find('.js_answerButton');
                if (button.hasClass('btn-success')) {
                    correctIndex = i;
                    correctAnswerText = normalizeAnswer($(el).text());
                    isCorrect = (i === answerIndex);
                }
            });

            // If no success found, look for danger on answer
            if (correctIndex === -1) {
                const selectedButton = $(answers[answerIndex]).find('.js_answerButton');
                isCorrect = !selectedButton.hasClass('btn-danger');
                
                // Find the answer (the one without danger class)
                answers.some((el, i) => {
                    const button = $(el).find('.js_answerButton');
                    if (!button.hasClass('btn-danger') && i !== answerIndex) {
                        correctIndex = i;
                        correctAnswerText = normalizeAnswer($(el).text());
                        return true;
                    }
                    return false;
                });
            }

            debug.log(`Correctness detection - isCorrect: ${isCorrect}, correctIndex: ${correctIndex}`);

            if (!isCorrect && correctIndex !== -1) {
                debug.log('Incorrect answer. answer is:', correctIndex, correctAnswerText);
                
                // Update database with answer
                if (!learningDatabase[questionText]) {
                    learningDatabase[questionText] = {};
                }
                learningDatabase[questionText][correctAnswerText] = correctIndex;
                
                // Get answer texts
                const wrongAnswerText = currentAnswers[answerIndex];
                
                // correction message
                const correctionMessage = `You answered ${answerIndex} ("${wrongAnswerText}") which was incorrect. ` +
                    `The correct answer was ${correctIndex} ("${correctAnswerText}"). ` +
                    `Remember this for future similar questions.`;
                
                // Update conversation history
                conversationHistory.push(
                    {
                        role: "user",
                        content: `Question: ${questionText}\nAnswers:\n${answerChoices}`
                    },
                    {
                        role: "assistant",
                        content: answerIndex.toString()
                    },
                    {
                        role: "system",
                        content: correctionMessage
                    }
                );
                
                debug.log('Updated database and history');
            } else if (isCorrect) {
                debug.log('Answer was good');
                // Store the correct answer in database
                if (!learningDatabase[questionText]) {
                    learningDatabase[questionText] = {};
                }
                learningDatabase[questionText][correctAnswerText] = answerIndex;
            } else {
                debug.warn('Could not get correct answer');
            }

            await proceedToNext();
            return await answerQuestion();

        } catch (error) {
            debug.error('Error in answerQuestion:', error);
            await sleep(5000);
            return await answerQuestion();
        }
    };

    const waitForFeedback = async () => {
        debug.log('wait for feedback...');
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total (100ms * 50)
        
        await new Promise(res => {
            const interval = setInterval(() => {
                attempts++;
                // Check if answer button has success/danger
                const answerButtons = $('#answercontainer').find('.js_answerButton');
                let hasFeedback = false;
                
                answerButtons.each(function() {
                    if ($(this).hasClass('btn-success') || $(this).hasClass('btn-danger')) {
                        hasFeedback = true;
                        debug.log('Feedback class found:', $(this).attr('class'));
                        return false; // break the loop
                    }
                });

                if (hasFeedback || attempts >= maxAttempts) {
                    debug.log(hasFeedback ? 'Feedback detected' : 'Max attempts reached');
                    clearInterval(interval);
                    res();
                }
            }, 100);
        });
        await sleep(300); // Additional delay
    };

    const proceedToNext = async () => {
        debug.log('Proceeding to next question...');
        await sleep(1500);
        const nextButton = $('#lnkNext');
        if (nextButton.length) {
            nextButton.click();
        } else {
            debug.error('Next button not found!');
        }
    };

    debug.log('Starting quiz...');
    answerQuestion();
})();