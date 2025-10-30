(function () {
    'use strict';

    let wasm;

    const heap = new Array(128).fill(undefined);

    heap.push(undefined, null, true, false);

    function getObject(idx) { return heap[idx]; }

    let heap_next = heap.length;

    function dropObject(idx) {
        if (idx < 132) return;
        heap[idx] = heap_next;
        heap_next = idx;
    }

    function takeObject(idx) {
        const ret = getObject(idx);
        dropObject(idx);
        return ret;
    }

    const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

    if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); }
    let cachedUint8Memory0 = null;

    function getUint8Memory0() {
        if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
            cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
        }
        return cachedUint8Memory0;
    }

    function getStringFromWasm0(ptr, len) {
        ptr = ptr >>> 0;
        return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
    }

    function addHeapObject(obj) {
        if (heap_next === heap.length) heap.push(heap.length + 1);
        const idx = heap_next;
        heap_next = heap[idx];

        heap[idx] = obj;
        return idx;
    }

    let WASM_VECTOR_LEN = 0;

    function passArray8ToWasm0(arg, malloc) {
        const ptr = malloc(arg.length * 1, 1) >>> 0;
        getUint8Memory0().set(arg, ptr / 1);
        WASM_VECTOR_LEN = arg.length;
        return ptr;
    }
    /**
    * Create a DeepFilterNet Model
    *
    * Args:
    *     - path: File path to a DeepFilterNet tar.gz onnx model
    *     - atten_lim: Attenuation limit in dB.
    *
    * Returns:
    *     - DF state doing the full processing: stft, DNN noise reduction, istft.
    * @param {Uint8Array} model_bytes
    * @param {number} atten_lim
    * @returns {number}
    */
    function df_create(model_bytes, atten_lim) {
        const ptr0 = passArray8ToWasm0(model_bytes, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.df_create(ptr0, len0, atten_lim);
        return ret >>> 0;
    }

    /**
    * Get DeepFilterNet frame size in samples.
    * @param {number} st
    * @returns {number}
    */
    function df_get_frame_length(st) {
        const ret = wasm.df_get_frame_length(st);
        return ret >>> 0;
    }

    /**
    * Set DeepFilterNet attenuation limit.
    *
    * Args:
    *     - lim_db: New attenuation limit in dB.
    * @param {number} st
    * @param {number} lim_db
    */
    function df_set_atten_lim(st, lim_db) {
        wasm.df_set_atten_lim(st, lim_db);
    }

    let cachedFloat32Memory0 = null;

    function getFloat32Memory0() {
        if (cachedFloat32Memory0 === null || cachedFloat32Memory0.byteLength === 0) {
            cachedFloat32Memory0 = new Float32Array(wasm.memory.buffer);
        }
        return cachedFloat32Memory0;
    }

    function passArrayF32ToWasm0(arg, malloc) {
        const ptr = malloc(arg.length * 4, 4) >>> 0;
        getFloat32Memory0().set(arg, ptr / 4);
        WASM_VECTOR_LEN = arg.length;
        return ptr;
    }
    /**
    * Processes a chunk of samples.
    *
    * Args:
    *     - df_state: Created via df_create()
    *     - input: Input buffer of length df_get_frame_length()
    *     - output: Output buffer of length df_get_frame_length()
    *
    * Returns:
    *     - Local SNR of the current frame.
    * @param {number} st
    * @param {Float32Array} input
    * @returns {Float32Array}
    */
    function df_process_frame(st, input) {
        const ptr0 = passArrayF32ToWasm0(input, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.df_process_frame(st, ptr0, len0);
        return takeObject(ret);
    }

    function handleError(f, args) {
        try {
            return f.apply(this, args);
        } catch (e) {
            wasm.__wbindgen_exn_store(addHeapObject(e));
        }
    }

    (typeof FinalizationRegistry === 'undefined')
        ? { }
        : new FinalizationRegistry(ptr => wasm.__wbg_dfstate_free(ptr >>> 0));

    function __wbg_get_imports() {
        const imports = {};
        imports.wbg = {};
        imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
            takeObject(arg0);
        };
        imports.wbg.__wbg_crypto_566d7465cdbb6b7a = function(arg0) {
            const ret = getObject(arg0).crypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_object = function(arg0) {
            const val = getObject(arg0);
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        };
        imports.wbg.__wbg_process_dc09a8c7d59982f6 = function(arg0) {
            const ret = getObject(arg0).process;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_versions_d98c6400c6ca2bd8 = function(arg0) {
            const ret = getObject(arg0).versions;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_node_caaf83d002149bd5 = function(arg0) {
            const ret = getObject(arg0).node;
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_is_string = function(arg0) {
            const ret = typeof(getObject(arg0)) === 'string';
            return ret;
        };
        imports.wbg.__wbg_require_94a9da52636aacbf = function() { return handleError(function () {
            const ret = module.require;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbindgen_is_function = function(arg0) {
            const ret = typeof(getObject(arg0)) === 'function';
            return ret;
        };
        imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_msCrypto_0b84745e9245cdf6 = function(arg0) {
            const ret = getObject(arg0).msCrypto;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_randomFillSync_290977693942bf03 = function() { return handleError(function (arg0, arg1) {
            getObject(arg0).randomFillSync(takeObject(arg1));
        }, arguments) };
        imports.wbg.__wbg_getRandomValues_260cc23a41afad9a = function() { return handleError(function (arg0, arg1) {
            getObject(arg0).getRandomValues(getObject(arg1));
        }, arguments) };
        imports.wbg.__wbg_newnoargs_e258087cd0daa0ea = function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_call_27c0f87801dedf93 = function() { return handleError(function (arg0, arg1) {
            const ret = getObject(arg0).call(getObject(arg1));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
            const ret = getObject(arg0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_self_ce0dbfc45cf2f5be = function() { return handleError(function () {
            const ret = self.self;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_window_c6fb939a7f436783 = function() { return handleError(function () {
            const ret = window.window;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_globalThis_d1e6af4856ba331b = function() { return handleError(function () {
            const ret = globalThis.globalThis;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_global_207b558942527489 = function() { return handleError(function () {
            const ret = global.global;
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbindgen_is_undefined = function(arg0) {
            const ret = getObject(arg0) === undefined;
            return ret;
        };
        imports.wbg.__wbg_call_b3ca7c6051f9bec1 = function() { return handleError(function (arg0, arg1, arg2) {
            const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
            return addHeapObject(ret);
        }, arguments) };
        imports.wbg.__wbg_buffer_12d079cc21e14bdb = function(arg0) {
            const ret = getObject(arg0).buffer;
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_aa4a17c33a06e5cb = function(arg0, arg1, arg2) {
            const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_63b92bc8671ed464 = function(arg0) {
            const ret = new Uint8Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_set_a47bac70306a19a7 = function(arg0, arg1, arg2) {
            getObject(arg0).set(getObject(arg1), arg2 >>> 0);
        };
        imports.wbg.__wbg_newwithbyteoffsetandlength_4a659d079a1650e0 = function(arg0, arg1, arg2) {
            const ret = new Float32Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_new_9efabd6b6d2ce46d = function(arg0) {
            const ret = new Float32Array(getObject(arg0));
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_newwithlength_e9b4878cebadb3d3 = function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbg_subarray_a1f73cd4b5b42fe1 = function(arg0, arg1, arg2) {
            const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
            return addHeapObject(ret);
        };
        imports.wbg.__wbindgen_throw = function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        };
        imports.wbg.__wbindgen_memory = function() {
            const ret = wasm.memory;
            return addHeapObject(ret);
        };

        return imports;
    }

    function __wbg_finalize_init(instance, module) {
        wasm = instance.exports;
        cachedFloat32Memory0 = null;
        cachedUint8Memory0 = null;


        return wasm;
    }

    function initSync(module) {
        if (wasm !== undefined) return wasm;

        const imports = __wbg_get_imports();

        if (!(module instanceof WebAssembly.Module)) {
            module = new WebAssembly.Module(module);
        }

        const instance = new WebAssembly.Instance(module, imports);

        return __wbg_finalize_init(instance);
    }

    /**
     * Interleaved -> Planar audio buffer conversion
     *
     * This is useful to get data from a codec, the network, or anything that is
     * interleaved, into a planar format, for example a Web Audio API AudioBuffer or
     * the output parameter of an AudioWorkletProcessor.
     *
     * @param {Float32Array} input is an array of n*128 frames arrays, interleaved,
     * where n is the channel count.
     * @param {Float32Array} output is an array of 128-frames arrays.
     */
    /** The base RingBuffer class
     *
     * A Single Producer - Single Consumer thread-safe wait-free ring buffer.
     *
     * The producer and the consumer can be on separate threads, but cannot change roles,
     * except with external synchronization.
     */
    class RingBuffer {
        /** Allocate the SharedArrayBuffer for a RingBuffer, based on the type and
         * capacity required
         * @param {number} capacity The number of elements the ring buffer will be
         * able to hold.
         * @param {TypedArray} type A typed array constructor, the type that this ring
         * buffer will hold.
         * @return {SharedArrayBuffer} A SharedArrayBuffer of the right size.
         * @static
         */
        static getStorageForCapacity(capacity, type) {
            if (!type.BYTES_PER_ELEMENT) {
                throw TypeError('Pass in a ArrayBuffer subclass');
            }
            const bytes = 8 + (capacity + 1) * type.BYTES_PER_ELEMENT;
            return new SharedArrayBuffer(bytes);
        }
        /**
         * @constructor
         * @param {SharedArrayBuffer} sab A SharedArrayBuffer obtained by calling
         * {@link RingBuffer.getStorageFromCapacity}.
         * @param {TypedArray} type A typed array constructor, the type that this ring
         * buffer will hold.
         */
        constructor(sab, type) {
            if (type.BYTES_PER_ELEMENT === undefined) {
                throw TypeError('Pass a concrete typed array class as second argument');
            }
            // Maximum usable size is 1<<32 - type.BYTES_PER_ELEMENT bytes in the ring
            // buffer for this version, easily changeable.
            // -4 for the write ptr (uint32_t offsets)
            // -4 for the read ptr (uint32_t offsets)
            // capacity counts the empty slot to distinguish between full and empty.
            this._type = type;
            this._capacity = (sab.byteLength - 8) / type.BYTES_PER_ELEMENT;
            this.buf = sab;
            this.write_ptr = new Uint32Array(this.buf, 0, 1);
            this.read_ptr = new Uint32Array(this.buf, 4, 1);
            this.storage = new type(this.buf, 8, this._capacity);
        }
        /**
         * @return the type of the underlying ArrayBuffer for this RingBuffer. This
         * allows implementing crude type checking.
         */
        type() {
            return this._type.name;
        }
        /**
         * Push elements to the ring buffer.
         * @param {TypedArray} elements A typed array of the same type as passed in the ctor, to be written to the queue.
         * @param {Number} length If passed, the maximum number of elements to push.
         * If not passed, all elements in the input array are pushed.
         * @param {Number} offset If passed, a starting index in elements from which
         * the elements are read. If not passed, elements are read from index 0.
         * @return the number of elements written to the queue.
         */
        push(elements, length, offset = 0) {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            if ((wr + 1) % this._storage_capacity() === rd) {
                // full
                return 0;
            }
            const len = length ?? elements.length;
            const to_write = Math.min(this._available_write(rd, wr), len);
            const first_part = Math.min(this._storage_capacity() - wr, to_write);
            const second_part = to_write - first_part;
            this._copy(elements, offset, this.storage, wr, first_part);
            this._copy(elements, offset + first_part, this.storage, 0, second_part);
            // publish the enqueued data to the other side
            Atomics.store(this.write_ptr, 0, (wr + to_write) % this._storage_capacity());
            return to_write;
        }
        /**
         * Write bytes to the ring buffer using callbacks. This create wrapper
         * objects and can GC, so it's best to no use this variant from a real-time
         * thread such as an AudioWorklerProcessor `process` method.
         * The callback is passed two typed arrays of the same type, to be filled.
         * This allows skipping copies if the API that produces the data writes is
         * passed arrays to write to, such as `AudioData.copyTo`.
         * @param {number} amount The maximum number of elements to write to the ring
         * buffer. If amount is more than the number of slots available for writing,
         * then the number of slots available for writing will be made available: no
         * overwriting of elements can happen.
         * @param {Function} cb A callback with two parameters, that are two typed
         * array of the correct type, in which the data need to be copied. If the
         * callback doesn't return anything, it is assumed all the elements
         * have been written to. Otherwise, it is assumed that the returned number is
         * the number of elements that have been written to, and those elements have
         * been written started at the beginning of the requested buffer space.
         *
         * @return The number of elements written to the queue.
         */
        writeCallback(amount, cb) {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            if ((wr + 1) % this._storage_capacity() === rd) {
                // full
                return 0;
            }
            const to_write = Math.min(this._available_write(rd, wr), amount);
            const first_part = Math.min(this._storage_capacity() - wr, to_write);
            const second_part = to_write - first_part;
            // This part will cause GC: don't use in the real time thread.
            // Variables are created but not used in this callback-based approach
            void new this._type(this.storage.buffer, 8 + wr * this.storage.BYTES_PER_ELEMENT, first_part);
            void new this._type(this.storage.buffer, 8 + 0, second_part);
            const written = cb() ?? to_write;
            // publish the enqueued data to the other side
            Atomics.store(this.write_ptr, 0, (wr + written) % this._storage_capacity());
            return written;
        }
        /**
         * Write bytes to the ring buffer using a callback.
         *
         * This allows skipping copies if the API that produces the data writes is
         * passed arrays to write to, such as `AudioData.copyTo`.
         *
         * @param {number} amount The maximum number of elements to write to the ring
         * buffer. If amount is more than the number of slots available for writing,
         * then the number of slots available for writing will be made available: no
         * overwriting of elements can happen.
         * @param {Function} cb A callback with five parameters:
         *
         * (1) The internal storage of the ring buffer as a typed array
         * (2) An offset to start writing from
         * (3) A number of elements to write at this offset
         * (4) Another offset to start writing from
         * (5) A number of elements to write at this second offset
         *
         * If the callback doesn't return anything, it is assumed all the elements
         * have been written to. Otherwise, it is assumed that the returned number is
         * the number of elements that have been written to, and those elements have
         * been written started at the beginning of the requested buffer space.
         * @return The number of elements written to the queue.
         */
        writeCallbackWithOffset(amount, cb) {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            if ((wr + 1) % this._storage_capacity() === rd) {
                // full
                return 0;
            }
            const to_write = Math.min(this._available_write(rd, wr), amount);
            Math.min(this._storage_capacity() - wr, to_write);
            const written = cb() ?? to_write;
            // publish the enqueued data to the other side
            Atomics.store(this.write_ptr, 0, (wr + written) % this._storage_capacity());
            return written;
        }
        /**
         * Read up to `elements.length` elements from the ring buffer. `elements` is a typed
         * array of the same type as passed in the ctor.
         * Returns the number of elements read from the queue, they are placed at the
         * beginning of the array passed as parameter.
         * @param {TypedArray} elements An array in which the elements read from the
         * queue will be written, starting at the beginning of the array.
         * @param {Number} length If passed, the maximum number of elements to pop. If
         * not passed, up to elements.length are popped.
         * @param {Number} offset If passed, an index in elements in which the data is
         * written to. `elements.length - offset` must be greater or equal to
         * `length`.
         * @return The number of elements read from the queue.
         */
        pop(elements, length, offset = 0) {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            if (wr === rd) {
                return 0;
            }
            const len = length ?? elements.length;
            const to_read = Math.min(this._available_read(rd, wr), len);
            const first_part = Math.min(this._storage_capacity() - rd, to_read);
            const second_part = to_read - first_part;
            this._copy(this.storage, rd, elements, offset, first_part);
            this._copy(this.storage, 0, elements, offset + first_part, second_part);
            Atomics.store(this.read_ptr, 0, (rd + to_read) % this._storage_capacity());
            return to_read;
        }
        /**
         * @return True if the ring buffer is empty false otherwise. This can be late
         * on the reader side: it can return true even if something has just been
         * pushed.
         */
        empty() {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            return wr === rd;
        }
        /**
         * @return True if the ring buffer is full, false otherwise. This can be late
         * on the write side: it can return true when something has just been popped.
         */
        full() {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            return (wr + 1) % this._storage_capacity() === rd;
        }
        /**
         * @return The usable capacity for the ring buffer: the number of elements
         * that can be stored.
         */
        capacity() {
            return this._capacity - 1;
        }
        /**
         * @return The number of elements available for reading. This can be late, and
         * report less elements that is actually in the queue, when something has just
         * been enqueued.
         */
        availableRead() {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            return this._available_read(rd, wr);
        }
        /**
         * @return The number of elements available for writing. This can be late, and
         * report less elements that is actually available for writing, when something
         * has just been dequeued.
         */
        availableWrite() {
            const rd = Atomics.load(this.read_ptr, 0);
            const wr = Atomics.load(this.write_ptr, 0);
            return this._available_write(rd, wr);
        }
        // private methods //
        /**
         * @return Number of elements available for reading, given a read and write
         * pointer.
         * @private
         */
        _available_read(rd, wr) {
            return (wr + this._storage_capacity() - rd) % this._storage_capacity();
        }
        /**
         * @return Number of elements available from writing, given a read and write
         * pointer.
         * @private
         */
        _available_write(rd, wr) {
            return this.capacity() - this._available_read(rd, wr);
        }
        /**
         * @return The size of the storage for elements not accounting the space for
         * the index, counting the empty slot.
         * @private
         */
        _storage_capacity() {
            return this._capacity;
        }
        /**
         * Copy `size` elements from `input`, starting at offset `offset_input`, to
         * `output`, starting at offset `offset_output`.
         * @param {TypedArray} input The array to copy from
         * @param {Number} offset_input The index at which to start the copy
         * @param {TypedArray} output The array to copy to
         * @param {Number} offset_output The index at which to start copying the elements to
         * @param {Number} size The number of elements to copy
         * @private
         */
        _copy(input, offset_input, output, offset_output, size) {
            for (let i = 0; i < size; i++) {
                output[offset_output + i] = input[offset_input + i];
            }
        }
    }
    /**
     * Send interleaved audio frames to another thread, wait-free.
     *
     * These classes allow communicating between a non-real time thread (browser
     * main thread or worker) and a real-time thread (in an AudioWorkletProcessor).
     * Write and Reader cannot change role after setup, unless externally
     * synchronized.
     *
     * GC _can_ happen during the initial construction of this object when hopefully
     * no audio is being output. This depends on how implementations schedule GC
     * passes. After the setup phase no GC is triggered on either side of the queue.
     */
    class AudioWriter {
        /**
         * From a RingBuffer, build an object that can enqueue enqueue audio in a ring
         * buffer.
         * @constructor
         */
        constructor(ringbuf) {
            if (ringbuf.type() !== 'Float32Array') {
                throw TypeError('This class requires a ring buffer of Float32Array');
            }
            this.ringbuf = ringbuf;
        }
        /**
         * Enqueue a buffer of interleaved audio into the ring buffer.
         *
         *
         * Care should be taken to enqueue a number of samples that is a multiple of the
         * channel count of the audio stream.
         *
         * @param {Float32Array} buf An array of interleaved audio frames.
         *
         * @return The number of samples that have been successfuly written to the
         * queue. `buf` is not written to during this call, so the samples that
         * haven't been written to the queue are still available.
         */
        enqueue(buf) {
            return this.ringbuf.push(buf);
        }
        /**
         * @return The free space in the ring buffer. This is the amount of samples
         * that can be queued, with a guarantee of success.
         */
        availableWrite() {
            return this.ringbuf.availableWrite();
        }
    }
    /**
     * Receive interleaved audio frames to another thread, wait-free.
     *
     * GC _can_ happen during the initial construction of this object when hopefully
     * no audio is being output. This depends on how implementations schedule GC
     * passes. After the setup phase no GC is triggered on either side of the queue.
     */
    class AudioReader {
        /**
         * From a RingBuffer, build an object that can dequeue audio in a ring
         * buffer.
         * @constructor
         */
        constructor(ringbuf) {
            if (ringbuf.type() !== 'Float32Array') {
                throw TypeError('This class requires a ring buffer of Float32Array');
            }
            this.ringbuf = ringbuf;
        }
        /**
         * Attempt to dequeue at most `buf.length` samples from the queue. This
         * returns the number of samples dequeued. If greater than 0, the samples are
         * at the beginning of `buf`.
         *
         * Care should be taken to dequeue a number of samples that is a multiple of the
         * channel count of the audio stream.
         *
         * @param {Float32Array} buf A buffer in which to copy the dequeued
         * interleaved audio frames.
         * @return The number of samples dequeued.
         */
        dequeue(buf) {
            if (this.ringbuf.empty()) {
                return 0;
            }
            return this.ringbuf.pop(buf);
        }
        /**
         * Query the occupied space in the queue.
         *
         * @return The amount of samples that can be read with a guarantee of success.
         *
         */
        availableRead() {
            return this.ringbuf.availableRead();
        }
    }

    const WorkerMessageTypes = {
        INIT: 'INIT',
        SET_SUPPRESSION_LEVEL: 'SET_SUPPRESSION_LEVEL',
        STOP: 'STOP',
        SET_BYPASS: 'SET_BYPASS',
        FETCH_WASM: 'FETCH_WASM',
        SETUP_AWP: 'SETUP_AWP',
        ERROR: 'ERROR'
    };

    let frame_length;
    let df_model = null;
    let _audio_reader = null;
    let _audio_writer = null;
    let rawStorage;
    let interval = null;
    let bypass = false;
    const suppression_level = 50;
    function readFromQueue() {
        if (!_audio_reader || !_audio_writer || !df_model)
            return 0;
        if (_audio_reader.availableRead() < frame_length) {
            return 0;
        }
        const samples_read = _audio_reader.dequeue(rawStorage);
        const input_frame = rawStorage.subarray(0, samples_read);
        const output_frame = bypass
            ? input_frame
            : df_process_frame(df_model, input_frame);
        _audio_writer.enqueue(output_frame);
        return samples_read;
    }
    self.onmessage = async (e) => {
        switch (e.data.command) {
            case WorkerMessageTypes.INIT: {
                _audio_reader = new AudioReader(new RingBuffer(e.data.rawSab, Float32Array));
                _audio_writer = new AudioWriter(new RingBuffer(e.data.denoisedSab, Float32Array));
                try {
                    initSync(e.data.bytes);
                    const uint8Array = new Uint8Array(e.data.model_bytes);
                    df_model = df_create(uint8Array, e.data.suppression_level ?? suppression_level);
                    frame_length = df_get_frame_length(df_model);
                    rawStorage = new Float32Array(frame_length);
                    interval = setInterval(readFromQueue, 0);
                    self.postMessage({ type: WorkerMessageTypes.SETUP_AWP });
                }
                catch (error) {
                    self.postMessage({
                        type: WorkerMessageTypes.ERROR,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
                break;
            }
            case WorkerMessageTypes.SET_SUPPRESSION_LEVEL: {
                const newLevel = e.data.level;
                if (df_model && typeof newLevel === 'number' && newLevel >= 0 && newLevel <= 100) {
                    df_set_atten_lim(df_model, newLevel);
                }
                break;
            }
            case WorkerMessageTypes.STOP: {
                if (interval !== null) {
                    clearInterval(interval);
                    interval = null;
                }
                break;
            }
            case WorkerMessageTypes.SET_BYPASS: {
                bypass = e.data.bypass;
                break;
            }
            default:
                throw new Error('Unhandled message type');
        }
    };
    self.postMessage({ type: WorkerMessageTypes.FETCH_WASM });

})();
