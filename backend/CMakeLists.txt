cmake_minimum_required(VERSION 3.15)
project(HospitalManagementSystem)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Set C++ standard and flags for MSVC
if(MSVC)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /std:c++17 /EHsc")
    add_definitions(-D_WIN32_WINNT=0x0601)
    add_definitions(-DWIN32_LEAN_AND_MEAN)
    add_definitions(/wd4996 /wd4819 /wd4267 /wd4244)
endif()

# Ensure vcpkg toolchain is being used
if(NOT DEFINED CMAKE_TOOLCHAIN_FILE)
    message(FATAL_ERROR "Please run cmake with -DCMAKE_TOOLCHAIN_FILE=D:/vcpkg/scripts/buildsystems/vcpkg.cmake")
endif()

# Crow include directory
set(CROW_INCLUDE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/Crow/include")
if(NOT EXISTS ${CROW_INCLUDE_DIR})
    message(FATAL_ERROR "Crow not found at ${CROW_INCLUDE_DIR}")
endif()

# vcpkg installation path
set(VCPKG_ROOT "D:/vcpkg/installed/x64-windows")
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}
    ${CROW_INCLUDE_DIR}
    ${VCPKG_ROOT}/include
)

# Find Boost
find_package(Boost REQUIRED COMPONENTS system thread)

# Find OpenSSL
find_package(OpenSSL REQUIRED)

# Find Asio (header-only, provided by vcpkg)
find_path(ASIO_INCLUDE_DIR "asio.hpp" PATHS ${VCPKG_ROOT}/include)
if(NOT ASIO_INCLUDE_DIR)
    message(FATAL_ERROR "Asio not found in vcpkg include directory")
endif()

# Find MongoDB C++ driver
find_package(bsoncxx CONFIG PATHS ${VCPKG_ROOT}/share/bsoncxx NO_DEFAULT_PATH REQUIRED)
find_package(mongocxx CONFIG PATHS ${VCPKG_ROOT}/share/mongocxx NO_DEFAULT_PATH REQUIRED)

# Add executable
add_executable(hms_server main.cpp)

# Link libraries
target_link_libraries(hms_server PRIVATE
    $<IF:$<TARGET_EXISTS:mongo::bsoncxx_static>,mongo::bsoncxx_static,mongo::bsoncxx_shared>
    $<IF:$<TARGET_EXISTS:mongo::mongocxx_static>,mongo::mongocxx_static,mongo::mongocxx_shared>
    ${Boost_LIBRARIES}
    OpenSSL::SSL
    OpenSSL::Crypto
    # Asio is header-only
)

# Windows-specific libraries
if(WIN32)
    target_link_libraries(hms_server PRIVATE ws2_32 wsock32)
endif()

# Set output directories
set_target_properties(hms_server PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY_DEBUG ${CMAKE_BINARY_DIR}
    RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_BINARY_DIR}
)

# Configuration summary
message(STATUS "=================================")
message(STATUS "Configuration Summary:")
message(STATUS "  Crow: ${CROW_INCLUDE_DIR}")
message(STATUS "  Boost: ${Boost_INCLUDE_DIRS}")
message(STATUS "  OpenSSL: ${OPENSSL_INCLUDE_DIR}")
message(STATUS "  Asio: ${ASIO_INCLUDE_DIR}")
message(STATUS "  MongoDB BSONCXX: ${bsoncxx_DIR}")
message(STATUS "  MongoDB MONGOCXX: ${mongocxx_DIR}")
message(STATUS "=================================")
