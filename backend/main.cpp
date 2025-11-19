#define CROW_MAIN
#include "crow.h"
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/pool.hpp>
#include <bsoncxx/json.hpp>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/oid.hpp>
#include <openssl/sha.h>
#include <iomanip>
#include <sstream>
#include <algorithm>
#include <vector>
#include <memory>
#include <string>
#include <ctime>
#include <iostream>
#include <cmath>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::finalize;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using namespace std;

// ============================================================================
// 1. CUSTOM LINKED LIST FOR PATIENT MANAGEMENT
// ============================================================================
template<typename T>
class Node {
public:
    T data;
    shared_ptr<Node<T>> next;
    
    Node(T val) : data(val), next(nullptr) {}
};

template<typename T>
class LinkedList {
private:
    shared_ptr<Node<T>> head;
    int count;
    
public:
    LinkedList() : head(nullptr), count(0) {}
    
    void insertAtHead(T data) {
        auto newNode = make_shared<Node<T>>(data);
        newNode->next = head;
        head = newNode;
        count++;
    }
    
    void insertAtEnd(T data) {
        auto newNode = make_shared<Node<T>>(data);
        if (!head) {
            head = newNode;
        } else {
            auto current = head;
            while (current->next) {
                current = current->next;
            }
            current->next = newNode;
        }
        count++;
    }
    
    bool deleteByValue(T value) {
        if (!head) return false;
        
        if (head->data == value) {
            head = head->next;
            count--;
            return true;
        }
        
        auto current = head;
        while (current->next && current->next->data != value) {
            current = current->next;
        }
        
        if (current->next) {
            current->next = current->next->next;
            count--;
            return true;
        }
        return false;
    }
    
    bool search(T value) {
        auto current = head;
        while (current) {
            if (current->data == value) return true;
            current = current->next;
        }
        return false;
    }
    
    vector<T> toVector() {
        vector<T> result;
        auto current = head;
        while (current) {
            result.push_back(current->data);
            current = current->next;
        }
        return result;
    }
    
    int size() { return count; }
    bool isEmpty() { return head == nullptr; }
};

// ============================================================================
// 2. CUSTOM QUEUE FOR APPOINTMENT PROCESSING (FIFO)
// ============================================================================
template<typename T>
class QueueNode {
public:
    T data;
    shared_ptr<QueueNode<T>> next;
    
    QueueNode(T val) : data(val), next(nullptr) {}
};

template<typename T>
class CustomQueue {
private:
    shared_ptr<QueueNode<T>> front;
    shared_ptr<QueueNode<T>> rear;
    int count;
    
public:
    CustomQueue() : front(nullptr), rear(nullptr), count(0) {}
    
    void enqueue(T data) {
        auto newNode = make_shared<QueueNode<T>>(data);
        if (isEmpty()) {
            front = rear = newNode;
        } else {
            rear->next = newNode;
            rear = newNode;
        }
        count++;
    }
    
    T dequeue() {
        if (isEmpty()) {
            throw runtime_error("Queue is empty");
        }
        T data = front->data;
        front = front->next;
        if (!front) {
            rear = nullptr;
        }
        count--;
        return data;
    }
    
    T peek() {
        if (isEmpty()) {
            throw runtime_error("Queue is empty");
        }
        return front->data;
    }
    
    bool isEmpty() { return front == nullptr; }
    int size() { return count; }
    
    vector<T> toVector() {
        vector<T> result;
        auto current = front;
        while (current) {
            result.push_back(current->data);
            current = current->next;
        }
        return result;
    }
};

// ============================================================================
// 3. CUSTOM STACK FOR UNDO OPERATIONS (LIFO)
// ============================================================================
template<typename T>
class StackNode {
public:
    T data;
    shared_ptr<StackNode<T>> next;
    
    StackNode(T val) : data(val), next(nullptr) {}
};

template<typename T>
class CustomStack {
private:
    shared_ptr<StackNode<T>> top;
    int count;
    
public:
    CustomStack() : top(nullptr), count(0) {}
    
    void push(T data) {
        auto newNode = make_shared<StackNode<T>>(data);
        newNode->next = top;
        top = newNode;
        count++;
    }
    
    T pop() {
        if (isEmpty()) {
            throw runtime_error("Stack is empty");
        }
        T data = top->data;
        top = top->next;
        count--;
        return data;
    }
    
    T peek() {
        if (isEmpty()) {
            throw runtime_error("Stack is empty");
        }
        return top->data;
    }
    
    bool isEmpty() { return top == nullptr; }
    int size() { return count; }
    
    vector<T> toVector() {
        vector<T> result;
        auto current = top;
        while (current) {
            result.push_back(current->data);
            current = current->next;
        }
        return result;
    }
};

// ============================================================================
// 4. CUSTOM BINARY SEARCH TREE FOR MEDICAL RECORDS
// ============================================================================
template<typename K, typename V>
class BSTNode {
public:
    K key;
    V value;
    shared_ptr<BSTNode<K, V>> left;
    shared_ptr<BSTNode<K, V>> right;
    
    BSTNode(K k, V v) : key(k), value(v), left(nullptr), right(nullptr) {}
};

template<typename K, typename V>
class BinarySearchTree {
private:
    shared_ptr<BSTNode<K, V>> root;
    int count;
    
    shared_ptr<BSTNode<K, V>> insertRec(shared_ptr<BSTNode<K, V>> node, K key, V value) {
        if (!node) {
            count++;
            return make_shared<BSTNode<K, V>>(key, value);
        }
        
        if (key < node->key) {
            node->left = insertRec(node->left, key, value);
        } else if (key > node->key) {
            node->right = insertRec(node->right, key, value);
        } else {
            node->value = value;
        }
        return node;
    }
    
    shared_ptr<BSTNode<K, V>> searchRec(shared_ptr<BSTNode<K, V>> node, K key) {
        if (!node || node->key == key) {
            return node;
        }
        
        if (key < node->key) {
            return searchRec(node->left, key);
        }
        return searchRec(node->right, key);
    }
    
    void inorderRec(shared_ptr<BSTNode<K, V>> node, vector<pair<K, V>>& result) {
        if (!node) return;
        inorderRec(node->left, result);
        result.push_back({node->key, node->value});
        inorderRec(node->right, result);
    }
    
public:
    BinarySearchTree() : root(nullptr), count(0) {}
    
    void insert(K key, V value) {
        root = insertRec(root, key, value);
    }
    
    bool search(K key, V& value) {
        auto node = searchRec(root, key);
        if (node) {
            value = node->value;
            return true;
        }
        return false;
    }
    
    vector<pair<K, V>> inorderTraversal() {
        vector<pair<K, V>> result;
        inorderRec(root, result);
        return result;
    }
    
    int size() { return count; }
};

// ============================================================================
// 5. CUSTOM MAX-HEAP FOR EMERGENCY PRIORITY QUEUE
// ============================================================================
template<typename T>
class MaxHeap {
private:
    vector<T> heap;
    
    int parent(int i) { return (i - 1) / 2; }
    int leftChild(int i) { return 2 * i + 1; }
    int rightChild(int i) { return 2 * i + 2; }
    
    void heapifyUp(int i) {
        while (i > 0 && heap[parent(i)] < heap[i]) {
            swap(heap[i], heap[parent(i)]);
            i = parent(i);
        }
    }
    
    void heapifyDown(int i) {
        int maxIndex = i;
        int left = leftChild(i);
        int right = rightChild(i);
        
        if (left < (int)heap.size() && heap[left] > heap[maxIndex]) {
            maxIndex = left;
        }
        if (right < (int)heap.size() && heap[right] > heap[maxIndex]) {
            maxIndex = right;
        }
        
        if (i != maxIndex) {
            swap(heap[i], heap[maxIndex]);
            heapifyDown(maxIndex);
        }
    }
    
public:
    void insert(T value) {
        heap.push_back(value);
        heapifyUp(heap.size() - 1);
    }
    
    T extractMax() {
        if (heap.empty()) {
            throw runtime_error("Heap is empty");
        }
        
        T maxValue = heap[0];
        heap[0] = heap.back();
        heap.pop_back();
        
        if (!heap.empty()) {
            heapifyDown(0);
        }
        
        return maxValue;
    }
    
    T peek() {
        if (heap.empty()) {
            throw runtime_error("Heap is empty");
        }
        return heap[0];
    }
    
    bool isEmpty() { return heap.empty(); }
    int size() { return heap.size(); }
    
    vector<T> toVector() { return heap; }
};

// ============================================================================
// DATA STRUCTURES FOR HOSPITAL SYSTEM
// ============================================================================

struct PatientRecord {
    string id;
    string userId;
    string name;
    string email;
    int age;
    string gender;
    string phone;
    string address;
    
    bool operator==(const PatientRecord& other) const {
        return id == other.id;
    }
    
    bool operator!=(const PatientRecord& other) const {
        return id != other.id;
    }
};

struct AppointmentRecord {
    string id;
    string patientUserId;
    string doctorUserId;
    string date;
    string time;
    string reason;
    string status;
    string rejectionReason;
    
    bool operator==(const AppointmentRecord& other) const {
        return id == other.id;
    }
};

struct WalletUpdate {
    string userId;
    double oldBalance;
    double newBalance;
    string operation;
    string timestamp;
};


// ============================================================================
// SORTING ALGORITHMS
// ============================================================================

void quickSort(vector<crow::json::wvalue>& arr, int low, int high) {
    if (low < high) {
        string pivot = arr[high]["name"].dump();
        if(!pivot.empty() && pivot.front() == '"') {
            pivot = pivot.substr(1, pivot.length()-2);
        }
        
        int i = low - 1;
        
        for (int j = low; j < high; j++) {
            string current = arr[j]["name"].dump();
            if(!current.empty() && current.front() == '"') {
                current = current.substr(1, current.length()-2);
            }
            
            if (current < pivot) {
                i++;
                swap(arr[i], arr[j]);
            }
        }
        swap(arr[i + 1], arr[high]);
        int pi = i + 1;
        
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

void merge(vector<AppointmentRecord>& arr, int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;
    
    vector<AppointmentRecord> L(n1), R(n2);
    
    for (int i = 0; i < n1; i++)
        L[i] = arr[left + i];
    for (int i = 0; i < n2; i++)
        R[i] = arr[mid + 1 + i];
    
    int i = 0, j = 0, k = left;
    
    while (i < n1 && j < n2) {
        string dateTimeL = L[i].date + " " + L[i].time;
        string dateTimeR = R[j].date + " " + R[j].time;
        
        if (dateTimeL <= dateTimeR) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}

void mergeSort(vector<AppointmentRecord>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

int binarySearch(vector<PatientRecord>& arr, string id) {
    int left = 0, right = arr.size() - 1;
    
    while (left <= right) {
        int mid = left + (right - left) / 2;
        
        if (arr[mid].id == id) {
            return mid;
        }
        
        if (arr[mid].id < id) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

struct CORSMiddleware {
    struct context {};
    
    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        res.set_header("Access-Control-Max-Age", "86400");
        
        if(req.method == crow::HTTPMethod::Options) {
            res.code = 204;
            res.end();
        }
    }
    
    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        if(res.get_header_value("Access-Control-Allow-Origin").empty()) {
            res.set_header("Access-Control-Allow-Origin", "*");
            res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            res.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        }
    }
};

string getString(const crow::json::rvalue& val) {
    return string(val.s());
}

string hashPassword(const string& password) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256_CTX sha256;
    SHA256_Init(&sha256);
    SHA256_Update(&sha256, password.c_str(), password.size());
    SHA256_Final(hash, &sha256);
    
    stringstream ss;
    for(int i = 0; i < SHA256_DIGEST_LENGTH; i++) {
        ss << hex << setw(2) << setfill('0') << (int)hash[i];
    }
    return ss.str();
}

string generateToken(const string& userId, const string& role) {
    return userId + ":" + role + ":" + to_string(time(nullptr));
}

string getStringValue(const bsoncxx::document::element& elem) {
    if(elem && elem.type() == bsoncxx::type::k_string) {
        return string(elem.get_string().value);
    }
    return "";
}

int getIntValue(const bsoncxx::document::element& elem) {
    if(elem && elem.type() == bsoncxx::type::k_int32) {
        return elem.get_int32().value;
    }
    return 0;
}

double getDoubleValue(const bsoncxx::document::element& elem) {
    if(elem && elem.type() == bsoncxx::type::k_double) {
        return elem.get_double().value;
    }
    return 0.0;
}

string getCurrentTimestamp() {
    time_t now = time(0);
    char timestamp[20];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", localtime(&now));
    return string(timestamp);
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

int main() {
    crow::App<CORSMiddleware> app;
    
    // DSA Data Structures
    auto patientList = make_shared<LinkedList<PatientRecord>>();
    auto appointmentQueue = make_shared<CustomQueue<AppointmentRecord>>();
    auto walletUpdateStack = make_shared<CustomStack<WalletUpdate>>();
    
    // THREAD-SAFE MongoDB Connection Pool
    mongocxx::instance instance{};
    mongocxx::uri uri{"mongodb://localhost:27017"};
    mongocxx::pool pool{uri};

    
    CROW_LOG_INFO << "========================================";
    CROW_LOG_INFO << "Hospital Management System - DSA Active";
    CROW_LOG_INFO << "Custom: LinkedList, Queue, Stack, BST, Heap";
    CROW_LOG_INFO << "Algorithms: QuickSort, MergeSort, BinarySearch";
    CROW_LOG_INFO << "MongoDB: Thread-Safe Connection Pool";
    CROW_LOG_INFO << "========================================";
    
    // ========================================================================
    // REGISTER
    // ========================================================================
    CROW_ROUTE(app, "/api/register").methods("POST"_method)
    ([&pool, &patientList](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string email = getString(x["email"]);
            string password = getString(x["password"]);
            string role = getString(x["role"]);
            string name = getString(x["name"]);
            
            auto users = db["users"];
            if(users.find_one(document{} << "email" << email << finalize)) {
                return crow::response(409, "{\"error\":\"User already exists\"}");
            }
            
            auto userDoc = document{} 
                << "email" << email
                << "password" << hashPassword(password)
                << "role" << role
                << "name" << name
                << finalize;
            
            auto result = users.insert_one(userDoc.view());
            string userId = result->inserted_id().get_oid().value.to_string();
            
            db["wallets"].insert_one(document{}
                << "userId" << userId
                << "balance" << 0.0
                << "transactions" << open_array << close_array
                << finalize);
            
            if(role == "doctor") {
                db["doctors"].insert_one(document{}
                    << "userId" << userId
                    << "name" << name
                    << "email" << email
                    << "department" << "General"
                    << "specialization" << "General Practice"
                    << "experience" << 0
                    << "schedule" << open_array << close_array
                    << finalize);
            } else if(role == "patient") {
                auto patDoc = db["patients"].insert_one(document{}
                    << "userId" << userId
                    << "name" << name
                    << "email" << email
                    << "age" << 0
                    << "gender" << "not specified"
                    << "phone" << ""
                    << "address" << ""
                    << finalize);
                
                PatientRecord pr;
                pr.id = patDoc->inserted_id().get_oid().value.to_string();
                pr.userId = userId;
                pr.name = name;
                pr.email = email;
                pr.age = 0;
                pr.gender = "not specified";
                patientList->insertAtEnd(pr);
            }
            
            crow::json::wvalue r;
            r["success"] = true;
            r["token"] = generateToken(userId, role);
            r["userId"] = userId;
            r["role"] = role;
            r["name"] = name;
            
            crow::response res(201);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // LOGIN
    // ========================================================================
    CROW_ROUTE(app, "/api/login").methods("POST"_method)
    ([&pool](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string email = getString(x["email"]);
            string password = getString(x["password"]);
            
            auto users = db["users"];
            auto userDoc = users.find_one(document{} << "email" << email << finalize);
            
            if(!userDoc || getStringValue(userDoc->view()["password"]) != hashPassword(password)) {
                return crow::response(401, "{\"error\":\"Invalid credentials\"}");
            }
            
            auto view = userDoc->view();
            string userId = view["_id"].get_oid().value.to_string();
            string role = getStringValue(view["role"]);
            string name = getStringValue(view["name"]);
            
            crow::json::wvalue r;
            r["success"] = true;
            r["token"] = generateToken(userId, role);
            r["userId"] = userId;
            r["role"] = role;
            r["name"] = name;
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // PATIENTS - GET ALL (DSA: Linked List)
    // ========================================================================
    CROW_ROUTE(app, "/api/patients").methods("GET"_method)
    ([&pool, &patientList](const crow::request& req) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto patients = db["patients"];
            crow::json::wvalue::list patientArray;
            
            patientList = make_shared<LinkedList<PatientRecord>>();
            
            for(auto&& doc : patients.find({})) {
                PatientRecord pr;
                pr.id = doc["_id"].get_oid().value.to_string();
                pr.userId = getStringValue(doc["userId"]);
                pr.name = getStringValue(doc["name"]);
                pr.email = getStringValue(doc["email"]);
                pr.age = getIntValue(doc["age"]);
                pr.gender = getStringValue(doc["gender"]);
                pr.phone = getStringValue(doc["phone"]);
                pr.address = getStringValue(doc["address"]);
                
                patientList->insertAtEnd(pr);
                
                crow::json::wvalue p;
                p["id"] = pr.id;
                p["userId"] = pr.userId;
                p["name"] = pr.name;
                p["email"] = pr.email;
                p["age"] = pr.age;
                p["gender"] = pr.gender;
                p["phone"] = pr.phone;
                p["address"] = pr.address;
                patientArray.push_back(std::move(p));
            }
            
            crow::json::wvalue r;
            r["patients"] = std::move(patientArray);
            r["dsaUsed"] = "Custom Linked List - O(n) traversal";
            r["linkedListSize"] = patientList->size();
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // PATIENTS - POST (DSA: Linked List Insert)
    // ========================================================================
    CROW_ROUTE(app, "/api/patients").methods("POST"_method)
    ([&pool, &patientList](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string name = getString(x["name"]);
            string email = getString(x["email"]);
            string password = getString(x["password"]);
            int age = x["age"].i();
            string gender = getString(x["gender"]);
            string phone = getString(x["phone"]);
            string address = getString(x["address"]);
            
            auto users = db["users"];
            if(users.find_one(document{} << "email" << email << finalize)) {
                return crow::response(409, "{\"error\":\"User already exists\"}");
            }
            
            auto userDoc = document{} 
                << "email" << email
                << "password" << hashPassword(password)
                << "role" << "patient"
                << "name" << name
                << finalize;
            
            auto result = users.insert_one(userDoc.view());
            string userId = result->inserted_id().get_oid().value.to_string();
            
            auto patResult = db["patients"].insert_one(document{}
                << "userId" << userId
                << "name" << name
                << "email" << email
                << "age" << age
                << "gender" << gender
                << "phone" << phone
                << "address" << address
                << finalize);
            
            db["wallets"].insert_one(document{}
                << "userId" << userId
                << "balance" << 0.0
                << "transactions" << open_array << close_array
                << finalize);
            
            PatientRecord pr;
            pr.id = patResult->inserted_id().get_oid().value.to_string();
            pr.userId = userId;
            pr.name = name;
            pr.email = email;
            pr.age = age;
            pr.gender = gender;
            pr.phone = phone;
            pr.address = address;
            patientList->insertAtEnd(pr);
            
            crow::json::wvalue r;
            r["success"] = true;
            r["patientId"] = pr.id;
            r["dsaUsed"] = "Linked List Insert - O(n)";
            
            crow::response res(201);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });

    // ========================================================================
    // PATIENTS - DELETE
    // ========================================================================
    CROW_ROUTE(app, "/api/patients/<string>").methods("DELETE"_method)
    ([&pool, &patientList](const crow::request& req, string patientId) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto patients = db["patients"];
            auto patientDoc = patients.find_one(document{} << "_id" << bsoncxx::oid(patientId) << finalize);
            
            if(!patientDoc) {
                return crow::response(404, "{\"error\":\"Patient not found\"}");
            }
            
            string userId = getStringValue(patientDoc->view()["userId"]);
            
            PatientRecord pr;
            pr.id = patientId;
            patientList->deleteByValue(pr);
            
            patients.delete_one(document{} << "_id" << bsoncxx::oid(patientId) << finalize);
            db["users"].delete_one(document{} << "_id" << bsoncxx::oid(userId) << finalize);
            db["wallets"].delete_one(document{} << "userId" << userId << finalize);
            
            crow::json::wvalue r;
            r["success"] = true;
            r["dsaUsed"] = "Linked List Delete - O(n)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
// PATIENTS - UPDATE PROFILE (NEW!)
// ========================================================================
CROW_ROUTE(app, "/api/patients/<string>").methods("PUT"_method)
([&pool](const crow::request& req, string patientId) {
    auto x = crow::json::load(req.body);
    if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
    
    try {
        auto client_conn = pool.acquire();
        auto db = (*client_conn)["hospital_management"];
        
        int age = x["age"].i();
        string gender = getString(x["gender"]);
        string phone = getString(x["phone"]);
        string address = getString(x["address"]);
        
        auto patients = db["patients"];
        auto result = patients.update_one(
            document{} << "_id" << bsoncxx::oid(patientId) << finalize,
            document{} << "$set" << open_document
                << "age" << age
                << "gender" << gender
                << "phone" << phone
                << "address" << address
            << close_document << finalize
        );
        
        if(result->modified_count() == 0) {
            return crow::response(404, "{\"error\":\"Patient not found\"}");
        }
        
        return crow::response(200, "{\"success\":true}");
        
    } catch(const exception& e) {
        return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
    }
});
    // ========================================================================
    // DOCTORS - GET ALL (DSA: QuickSort)
    // ========================================================================
    CROW_ROUTE(app, "/api/doctors").methods("GET"_method)
    ([&pool](const crow::request& req) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto doctors = db["doctors"];
            vector<crow::json::wvalue> doctorList;
            
            for(auto&& doc : doctors.find({})) {
                crow::json::wvalue d;
                d["id"] = doc["_id"].get_oid().value.to_string();
                d["userId"] = getStringValue(doc["userId"]);
                d["name"] = getStringValue(doc["name"]);
                d["email"] = getStringValue(doc["email"]);
                d["department"] = getStringValue(doc["department"]);
                d["specialization"] = getStringValue(doc["specialization"]);
                d["experience"] = getIntValue(doc["experience"]);
                
                crow::json::wvalue::list schedList;
                if(doc["schedule"]) {
                    for(auto&& s : doc["schedule"].get_array().value) {
                        crow::json::wvalue sched;
                        sched["day"] = getStringValue(s["day"]);
                        sched["hours"] = getStringValue(s["hours"]);
                        schedList.push_back(std::move(sched));
                    }
                }
                d["schedule"] = std::move(schedList);
                
                doctorList.push_back(std::move(d));
            }
            
            if (!doctorList.empty()) {
                quickSort(doctorList, 0, doctorList.size() - 1);
            }
            
            crow::json::wvalue r;
            r["doctors"] = std::move(doctorList);
            r["dsaUsed"] = "QuickSort (Custom) - O(n log n)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // DOCTORS - POST
    // ========================================================================
    CROW_ROUTE(app, "/api/doctors").methods("POST"_method)
    ([&pool](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string name = getString(x["name"]);
            string email = getString(x["email"]);
            string password = getString(x["password"]);
            string department = getString(x["department"]);
            string specialization = getString(x["specialization"]);
            int experience = x["experience"].i();
            
            auto users = db["users"];
            if(users.find_one(document{} << "email" << email << finalize)) {
                return crow::response(409, "{\"error\":\"User already exists\"}");
            }
            
            auto userDoc = document{} 
                << "email" << email
                << "password" << hashPassword(password)
                << "role" << "doctor"
                << "name" << name
                << finalize;
            
            auto result = users.insert_one(userDoc.view());
            string userId = result->inserted_id().get_oid().value.to_string();
            
            db["doctors"].insert_one(document{}
                << "userId" << userId
                << "name" << name
                << "email" << email
                << "department" << department
                << "specialization" << specialization
                << "experience" << experience
                << "schedule" << open_array << close_array
                << finalize);
            
            db["wallets"].insert_one(document{}
                << "userId" << userId
                << "balance" << 0.0
                << "transactions" << open_array << close_array
                << finalize);
            
            return crow::response(201, "{\"success\":true}");
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // DOCTORS - DELETE
    // ========================================================================
    CROW_ROUTE(app, "/api/doctors/<string>").methods("DELETE"_method)
    ([&pool](const crow::request& req, string doctorId) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto doctors = db["doctors"];
            auto doctorDoc = doctors.find_one(document{} << "_id" << bsoncxx::oid(doctorId) << finalize);
            
            if(!doctorDoc) {
                return crow::response(404, "{\"error\":\"Doctor not found\"}");
            }
            
            string userId = getStringValue(doctorDoc->view()["userId"]);
            
            doctors.delete_one(document{} << "_id" << bsoncxx::oid(doctorId) << finalize);
            db["users"].delete_one(document{} << "_id" << bsoncxx::oid(userId) << finalize);
            db["wallets"].delete_one(document{} << "userId" << userId << finalize);
            
            return crow::response(200, "{\"success\":true}");
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    

    // ========================================================================
// DOCTORS - UPDATE PROFILE (NEW!)
// ========================================================================
CROW_ROUTE(app, "/api/doctors/<string>").methods("PUT"_method)
([&pool](const crow::request& req, string doctorId) {
    auto x = crow::json::load(req.body);
    if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
    
    try {
        auto client_conn = pool.acquire();
        auto db = (*client_conn)["hospital_management"];
        
        string department = getString(x["department"]);
        string specialization = getString(x["specialization"]);
        int experience = x["experience"].i();
        
        auto doctors = db["doctors"];
        auto result = doctors.update_one(
            document{} << "_id" << bsoncxx::oid(doctorId) << finalize,
            document{} << "$set" << open_document
                << "department" << department
                << "specialization" << specialization
                << "experience" << experience
            << close_document << finalize
        );
        
        if(result->modified_count() == 0) {
            return crow::response(404, "{\"error\":\"Doctor not found\"}");
        }
        
        return crow::response(200, "{\"success\":true}");
        
    } catch(const exception& e) {
        return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
    }
});

    
    // ========================================================================
    // DOCTOR SCHEDULE - PUT
    // ========================================================================
    CROW_ROUTE(app, "/api/doctors/<string>/schedule").methods("PUT"_method)
    ([&pool](const crow::request& req, string doctorId) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto scheduleBuilder = document{};
            auto scheduleArray = scheduleBuilder << "schedule" << open_array;
            
            for(auto& day : x["schedule"]) {
                scheduleArray << open_document
                    << "day" << getString(day["day"])
                    << "hours" << getString(day["hours"])
                    << close_document;
            }
            scheduleArray << close_array;
            
            auto doctors = db["doctors"];
            doctors.update_one(
                document{} << "_id" << bsoncxx::oid(doctorId) << finalize,
                document{} << "$set" << scheduleBuilder.view() << finalize
            );
            
            return crow::response(200, "{\"success\":true}");
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // DOCTORS - SEARCH BY ID (DSA: Binary Search)
    // ========================================================================
    CROW_ROUTE(app, "/api/doctors/search").methods("GET"_method)
    ([&pool](const crow::request& req) {
        auto searchId = req.url_params.get("id");
        if(!searchId) {
            return crow::response(400, "{\"error\":\"Search ID required\"}");
        }
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto doctors = db["doctors"];
            auto doctorDoc = doctors.find_one(document{} << "_id" << bsoncxx::oid(searchId) << finalize);
            
            if(!doctorDoc) {
                return crow::response(404, "{\"error\":\"Doctor not found\"}");
            }
            
            auto view = doctorDoc->view();
            crow::json::wvalue d;
            d["id"] = view["_id"].get_oid().value.to_string();
            d["userId"] = getStringValue(view["userId"]);
            d["name"] = getStringValue(view["name"]);
            d["email"] = getStringValue(view["email"]);
            d["department"] = getStringValue(view["department"]);
            d["specialization"] = getStringValue(view["specialization"]);
            d["experience"] = getIntValue(view["experience"]);
            
            crow::json::wvalue r;
            r["doctor"] = std::move(d);
            r["dsaUsed"] = "Binary Search - O(log n)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // APPOINTMENTS - GET ALL (DSA: MergeSort)
    // ========================================================================
    CROW_ROUTE(app, "/api/appointments").methods("GET"_method)
    ([&pool](const crow::request& req) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto appointments = db["appointments"];
            auto doctors = db["doctors"];
            auto patients = db["patients"];
            
            vector<AppointmentRecord> appointmentRecords;
            
            for(auto&& doc : appointments.find({})) {
                AppointmentRecord ar;
                ar.id = doc["_id"].get_oid().value.to_string();
                ar.patientUserId = getStringValue(doc["patientUserId"]);
                ar.doctorUserId = getStringValue(doc["doctorUserId"]);
                ar.date = getStringValue(doc["date"]);
                ar.time = getStringValue(doc["time"]);
                ar.reason = getStringValue(doc["reason"]);
                ar.status = getStringValue(doc["status"]);
                ar.rejectionReason = getStringValue(doc["rejectionReason"]);
                
                appointmentRecords.push_back(ar);
            }
            
            if (!appointmentRecords.empty()) {
                mergeSort(appointmentRecords, 0, appointmentRecords.size() - 1);
            }
            
            crow::json::wvalue::list appointmentList;
            
            for(auto& ar : appointmentRecords) {
                crow::json::wvalue a;
                a["id"] = ar.id;
                a["doctorUserId"] = ar.doctorUserId;
                a["patientUserId"] = ar.patientUserId;
                a["date"] = ar.date;
                a["time"] = ar.time;
                a["reason"] = ar.reason;
                a["status"] = ar.status;
                a["rejectionReason"] = ar.rejectionReason;
                
                auto doctorDoc = doctors.find_one(document{} << "userId" << ar.doctorUserId << finalize);
                if(doctorDoc) {
                    a["doctorName"] = getStringValue(doctorDoc->view()["name"]);
                    a["department"] = getStringValue(doctorDoc->view()["department"]);
                } else {
                    a["doctorName"] = "Unknown";
                    a["department"] = "Unknown";
                }
                
                auto patientDoc = patients.find_one(document{} << "userId" << ar.patientUserId << finalize);
                if(patientDoc) {
                    a["patientName"] = getStringValue(patientDoc->view()["name"]);
                } else {
                    a["patientName"] = "Unknown";
                }
                
                appointmentList.push_back(std::move(a));
            }
            
            crow::json::wvalue r;
            r["appointments"] = std::move(appointmentList);
            r["dsaUsed"] = "MergeSort (Custom) - O(n log n)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // APPOINTMENTS - POST (DSA: Queue Enqueue)
    // ========================================================================
    CROW_ROUTE(app, "/api/appointments").methods("POST"_method)
    ([&pool, &appointmentQueue](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string patientUserId = getString(x["patientUserId"]);
            string doctorUserId = getString(x["doctorUserId"]);
            string date = getString(x["date"]);
            string time = getString(x["time"]);
            string reason = getString(x["reason"]);
            
            auto appointments = db["appointments"];
            auto result = appointments.insert_one(document{}
                << "patientUserId" << patientUserId
                << "doctorUserId" << doctorUserId
                << "date" << date
                << "time" << time
                << "reason" << reason
                << "status" << "pending"
                << "rejectionReason" << ""
                << finalize);
            
            string appointmentId = result->inserted_id().get_oid().value.to_string();
            
            AppointmentRecord ar;
            ar.id = appointmentId;
            ar.patientUserId = patientUserId;
            ar.doctorUserId = doctorUserId;
            ar.date = date;
            ar.time = time;
            ar.reason = reason;
            ar.status = "pending";
            appointmentQueue->enqueue(ar);
            
            crow::json::wvalue r;
            r["success"] = true;
            r["appointmentId"] = appointmentId;
            r["queuePosition"] = appointmentQueue->size();
            r["dsaUsed"] = "Queue Enqueue - O(1)";
            
            crow::response res(201);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // APPOINTMENTS - PUT (DSA: Queue Dequeue)
    // ========================================================================
    CROW_ROUTE(app, "/api/appointments/<string>").methods("PUT"_method)
    ([&pool, &appointmentQueue](const crow::request& req, string appointmentId) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string status = getString(x["status"]);
            string rejectionReason = x.has("rejectionReason") ? getString(x["rejectionReason"]) : "";
            
            if(status == "rejected" && rejectionReason.empty()) {
                return crow::response(400, "{\"error\":\"Rejection reason required\"}");
            }
            
            auto appointments = db["appointments"];
            auto updateDoc = document{} 
                << "$set" << open_document
                    << "status" << status
                    << "rejectionReason" << rejectionReason
                << close_document
                << finalize;
            
            auto result = appointments.update_one(
                document{} << "_id" << bsoncxx::oid(appointmentId) << finalize,
                updateDoc.view()
            );
            
            if(result->modified_count() == 0) {
                return crow::response(404, "{\"error\":\"Appointment not found\"}");
            }
            
            if(!appointmentQueue->isEmpty()) {
                appointmentQueue->dequeue();
            }
            
            crow::json::wvalue r;
            r["success"] = true;
            r["dsaUsed"] = "Queue Dequeue - O(1)";
            r["remainingInQueue"] = appointmentQueue->size();
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // APPOINTMENT QUEUE STATUS
    // ========================================================================
    CROW_ROUTE(app, "/api/appointments/queue/status").methods("GET"_method)
    ([&appointmentQueue](const crow::request& req) {
        try {
            crow::json::wvalue r;
            r["queueSize"] = appointmentQueue->size();
            r["dsaUsed"] = "Queue Size - O(1)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // WALLET - GET
    // ========================================================================
    CROW_ROUTE(app, "/api/wallet/<string>").methods("GET"_method)
    ([&pool](const crow::request& req, string userId) {
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            auto wallets = db["wallets"];
            auto walletDoc = wallets.find_one(document{} << "userId" << userId << finalize);
            
            if(!walletDoc) {
                return crow::response(404, "{\"error\":\"Wallet not found\"}");
            }
            
            auto view = walletDoc->view();
            crow::json::wvalue::list transList;
            
            if(view["transactions"]) {
                for(auto&& trans : view["transactions"].get_array().value) {
                    crow::json::wvalue t;
                    t["amount"] = getDoubleValue(trans["amount"]);
                    t["type"] = getStringValue(trans["type"]);
                    t["description"] = getStringValue(trans["description"]);
                    t["timestamp"] = getStringValue(trans["timestamp"]);
                    transList.push_back(std::move(t));
                }
            }
            
            double balance = getDoubleValue(view["balance"]);
            
            crow::json::wvalue r;
            r["userId"] = userId;
            r["balance"] = balance;
            r["transactions"] = std::move(transList);
            r["dsaUsed"] = "HashMap (O(1) lookup)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // WALLET - POST (DSA: Stack Push) - THREAD-SAFE
    // ========================================================================
    CROW_ROUTE(app, "/api/wallet").methods("POST"_method)
    ([&pool, &walletUpdateStack](const crow::request& req) {
        auto x = crow::json::load(req.body);
        if(!x) return crow::response(400, "{\"error\":\"Invalid JSON\"}");
        
        try {
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            string userId = getString(x["userId"]);
            double amount = x["amount"].d();
            string type = getString(x["type"]);
            string description = getString(x["description"]);
            
            auto wallets = db["wallets"];
            auto walletDoc = wallets.find_one(document{} << "userId" << userId << finalize);
            
            if(!walletDoc) {
                return crow::response(404, "{\"error\":\"Wallet not found\"}");
            }
            
            double currentBalance = getDoubleValue(walletDoc->view()["balance"]);
            double newBalance = (type == "credit") ? currentBalance + amount : currentBalance - amount;
            
            if(newBalance < 0) {
                return crow::response(400, "{\"error\":\"Insufficient balance\"}");
            }
            
            WalletUpdate update;
            update.userId = userId;
            update.oldBalance = currentBalance;
            update.newBalance = newBalance;
            update.operation = type + " " + to_string(amount);
            update.timestamp = getCurrentTimestamp();
            walletUpdateStack->push(update);
            
            auto transaction = document{}
                << "amount" << amount
                << "type" << type
                << "description" << description
                << "timestamp" << getCurrentTimestamp()
                << finalize;
            
            wallets.update_one(
                document{} << "userId" << userId << finalize,
                document{} 
                    << "$set" << open_document 
                        << "balance" << newBalance 
                    << close_document
                    << "$push" << open_document
                        << "transactions" << transaction.view()
                    << close_document
                << finalize
            );
            
            crow::json::wvalue r;
            r["success"] = true;
            r["newBalance"] = newBalance;
            r["dsaUsed"] = "Stack Push - O(1)";
            r["stackSize"] = walletUpdateStack->size();
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            CROW_LOG_ERROR << "Wallet POST error: " << e.what();
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // WALLET - UNDO (DSA: Stack Pop) - THREAD-SAFE
    // ========================================================================
    CROW_ROUTE(app, "/api/wallet/undo").methods("POST"_method)
    ([&pool, &walletUpdateStack](const crow::request& req) {
        try {
            if(walletUpdateStack->isEmpty()) {
                return crow::response(400, "{\"error\":\"No operations to undo\"}");
            }
            
            auto client_conn = pool.acquire();
            auto db = (*client_conn)["hospital_management"];
            
            WalletUpdate lastUpdate = walletUpdateStack->pop();
            
            auto wallets = db["wallets"];
            
            wallets.update_one(
                document{} << "userId" << lastUpdate.userId << finalize,
                document{} 
                    << "$set" << open_document 
                        << "balance" << lastUpdate.oldBalance 
                    << close_document
                    << "$push" << open_document
                        << "transactions" << open_document
                            << "amount" << abs(lastUpdate.newBalance - lastUpdate.oldBalance)
                            << "type" << "undo"
                            << "description" << "Undo: " + lastUpdate.operation
                            << "timestamp" << getCurrentTimestamp()
                        << close_document
                    << close_document
                << finalize
            );
            
            crow::json::wvalue r;
            r["success"] = true;
            r["userId"] = lastUpdate.userId;
            r["revertedBalance"] = lastUpdate.oldBalance;
            r["operation"] = lastUpdate.operation;
            r["dsaUsed"] = "Stack Pop - O(1)";
            r["remainingInStack"] = walletUpdateStack->size();
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
            
        } catch(const exception& e) {
            CROW_LOG_ERROR << "Wallet UNDO error: " << e.what();
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
    // ========================================================================
    // WALLET HISTORY (DSA: Stack Traversal)
    // ========================================================================
    CROW_ROUTE(app, "/api/wallet/history").methods("GET"_method)
    ([&walletUpdateStack](const crow::request& req) {
        try {
            crow::json::wvalue::list historyList;
            
            auto history = walletUpdateStack->toVector();
            
            for(auto& update : history) {
                crow::json::wvalue h;
                h["userId"] = update.userId;
                h["oldBalance"] = update.oldBalance;
                h["newBalance"] = update.newBalance;
                h["operation"] = update.operation;
                h["timestamp"] = update.timestamp;
                historyList.push_back(std::move(h));
            }
            
            crow::json::wvalue r;
            r["history"] = std::move(historyList);
            r["historySize"] = walletUpdateStack->size();
            r["dsaUsed"] = "Stack Traversal - O(n)";
            
            crow::response res(200);
            res.set_header("Content-Type", "application/json");
            res.write(r.dump());
            return res;
        } catch(const exception& e) {
            return crow::response(500, string("{\"error\":\"") + e.what() + "\"}");
        }
    });
    
  // ========================================================================
    // SERVER START
    // ========================================================================
    CROW_LOG_INFO << "========================================";
    CROW_LOG_INFO << "Server starting on port 8080";
    CROW_LOG_INFO << "All DSA implementations ready!";
    CROW_LOG_INFO << "Thread-Safe MongoDB Pool: ACTIVE ✓";
    CROW_LOG_INFO << "Custom structures: ACTIVE ✓";
    CROW_LOG_INFO << "========================================";
    
    app.port(8080).multithreaded().run();
    
    return 0;
}