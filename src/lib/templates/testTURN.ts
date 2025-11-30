export async function testTurnServer(
    turn_urls: string[] | undefined,
    username: string | undefined,
    credential: string | undefined
  ) {
    if (turn_urls && turn_urls.length > 0 && username && credential) {
      return new Promise((resolve) => {
        const config: RTCConfiguration = {
          iceServers: [
            {
              urls: turn_urls,
              username: username,
              credential: credential
            }
          ]
        };

        const pc = new RTCPeerConnection(config);
        const candidates: RTCIceCandidate[] = [];

        pc.onicecandidate = (e) => {
          if (e.candidate) {
            console.log(
              'ICE Candidate:',
              e.candidate.type,
              e.candidate.protocol,
              e.candidate.address
            );
            candidates.push(e.candidate);

            if (e.candidate.type === 'relay') {
              console.log('TURN WORKING! Relay candidate found:', e.candidate);
              resolve(true);
            }
          } else {
            console.log('No relay candidates found. All candidates:', candidates);
            resolve(false);
          }
        };

        pc.createDataChannel('test');
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch(console.error);

        setTimeout(() => {
          console.log('TURN test timeout');
          resolve(false);
        }, 5000);
      });
    }
  }

export async function testPureTurn() {
    const pc = new RTCPeerConnection({
      iceServers: [
        {
          urls: 'turn:threadbook.ru:3478?transport=udp',
          username: '1732770000:test',
          credential: 'dummy' // при auth-secret не проверяется сразу, но лучше правильный
        }
      ],
      iceTransportPolicy: 'relay' // ← КЛЮЧЕВО!
    });

    pc.createDataChannel('test');
    console.log('Pure TURN test started (relay only)');

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log('🧊', e.candidate.type, e.candidate.candidate);
        if (e.candidate.type === 'relay') {
          console.log('SUCCESS: relay candidate!');
        }
      } else {
        console.warn('ICE complete, no relay');
      }
    };

    await pc.setLocalDescription(await pc.createOffer());
  }